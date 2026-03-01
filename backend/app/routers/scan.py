from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import User, ScanSettings, ReviewQueueItem
from app.gmail_client import get_gmail_service, fetch_emails
from app.gemini_client import extract_purchases_from_email, CONFIDENCE_THRESHOLD
from app.emailparser import parse_json   # ← business analytics

router = APIRouter()


# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User {x_user_id} not found. Complete OAuth at /auth/google/start first."
        )
    if not user.refresh_token:
        raise HTTPException(
            status_code=401,
            detail="No Gmail token found. Complete OAuth at /auth/google/start."
        )
    return user


# ── Request/response schemas ──────────────────────────────────────────────────

class ScanInitialRequest(BaseModel):
    initial_scan_days: int  # Must be 30, 90, or 180


class ScanResponse(BaseModel):
    queued_count: int
    scanned_messages: int
    errors: int
    skipped_duplicates: int


# ── Core extraction logic ─────────────────────────────────────────────────────

def _process_emails_into_queue(
    emails: list[dict],
    user_id: str,
    db: Session,
) -> ScanResponse:
    """
    For each email: call Gemini, filter results, insert into ReviewQueueItems.

    DEDUPLICATION STRATEGY (two layers):

    Layer 1 — Email level: If any ReviewQueueItem already exists with this
    email_message_id for this user, skip the entire email. This prevents
    re-processing the same email on repeat scans.

    Layer 2 — Item level (Python check, not DB constraint): Before inserting
    each item, check if a row with the same (user_id, email_message_id,
    item_name) already exists. This catches the case where the same email
    is processed twice in one scan batch.
    """
    queued = 0
    errors = 0
    skipped_duplicates = 0
    scanned = len(emails)

    for email in emails:
        msg_id = email["message_id"]

        # LAYER 1 DEDUPE: Skip this whole email if we've seen it before
        already_processed = db.query(ReviewQueueItem).filter(
            ReviewQueueItem.user_id == user_id,
            ReviewQueueItem.email_message_id == msg_id,
        ).first()
        if already_processed:
            skipped_duplicates += 1
            continue

        extraction = extract_purchases_from_email(
            subject=email["subject"],
            plain_text=email.get("plain_text", ""),
            html_text=email.get("html_text", ""),
            prices_found=email.get("prices_found", []),
            image_urls=email.get("image_urls", []),
        )

        if extraction is None:
            errors += 1
            continue

        inserted_names_this_email: set[str] = set()
        available_images = email.get("image_urls", [])
        image_index = 0

        for item in extraction.items:
            if not item.is_clothing:
                continue
            if item.confidence < CONFIDENCE_THRESHOLD:
                continue

            normalized_name = item.item_name.strip().lower()
            if normalized_name in inserted_names_this_email:
                skipped_duplicates += 1
                continue

            price_cents: Optional[int] = None
            if item.price is not None:
                price_cents = int(round(item.price * 100))

            purchased_at: Optional[datetime] = None
            if item.purchased_at:
                try:
                    purchased_at = datetime.fromisoformat(item.purchased_at)
                except (ValueError, TypeError):
                    pass

            image_url = item.image_url
            if not image_url and image_index < len(available_images):
                image_url = available_images[image_index]
                image_index += 1

            new_item = ReviewQueueItem(
                user_id=user_id,
                source="gmail",
                status="pending",
                merchant=extraction.merchant,
                item_name=item.item_name,
                category=item.category_guess,
                price_cents=price_cents,
                currency="USD",
                purchased_at=purchased_at,
                email_message_id=msg_id,
                email_thread_id=email["thread_id"],
                image_url=image_url,
                extracted_json=extraction.dict(),
            )
            db.add(new_item)

            try:
                db.commit()
                queued += 1
                inserted_names_this_email.add(normalized_name)
            except IntegrityError:
                db.rollback()
                skipped_duplicates += 1

    return ScanResponse(
        queued_count=queued,
        scanned_messages=scanned,
        errors=errors,
        skipped_duplicates=skipped_duplicates,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/initial")
def scan_initial(
    body: ScanInitialRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Scans Gmail for the past N days and populates the Review Queue.
    Safe to call multiple times — duplicates are handled before any DB insert.
    """
    allowed_days = {30, 90, 180}
    if body.initial_scan_days not in allowed_days:
        raise HTTPException(
            status_code=400,
            detail=f"initial_scan_days must be one of {allowed_days}"
        )

    after_date = datetime.utcnow() - timedelta(days=body.initial_scan_days)
    after_date_str = after_date.strftime("%Y/%m/%d")

    gmail_service = get_gmail_service(user.refresh_token)

    print(f"[Scan] Fetching emails for user {user.email} after {after_date_str}")
    emails = fetch_emails(gmail_service, after_date_str, max_results=50)
    print(f"[Scan] Fetched {len(emails)} emails")

    result = _process_emails_into_queue(emails, user.id, db)

    # ── Business analytics: compute and store aggregates for this user ────────
    # This runs after every scan so the user_analytics table stays up to date.
    # compute_and_store_analytics reads ReviewQueueItems directly — no extra args needed.
    try:
        parse_json(user_id=user.id, db=db)
        print(f"[Scan] Analytics updated for user {user.email}")
    except Exception as e:
        # Never let analytics failure block the scan response
        print(f"[Scan] Analytics error (non-fatal): {e}")

    # Save scan settings so /scan/new knows where to start next time
    settings = db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first()
    if not settings:
        settings = ScanSettings(user_id=user.id)
        db.add(settings)
    settings.initial_scan_days = body.initial_scan_days
    settings.last_scan_at = datetime.utcnow()
    db.commit()

    print(f"[Scan] Done: queued={result.queued_count}, errors={result.errors}, dupes={result.skipped_duplicates}")
    return result


@router.post("/new")
def scan_new(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Scans for emails newer than the last scan time.
    User-triggered only — runs when they click "Check for new orders".
    """
    settings = db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first()

    if not settings or not settings.last_scan_at:
        raise HTTPException(
            status_code=400,
            detail="No previous scan found. Run POST /scan/initial first."
        )

    after_date_str = settings.last_scan_at.strftime("%Y/%m/%d")
    gmail_service = get_gmail_service(user.refresh_token)

    print(f"[Scan New] Fetching emails for user {user.email} after {after_date_str}")
    emails = fetch_emails(gmail_service, after_date_str, max_results=50)
    print(f"[Scan New] Fetched {len(emails)} emails")

    result = _process_emails_into_queue(emails, user.id, db)

    # ── Business analytics: update aggregates after new scan ─────────────────
    try:
        parse_json(user_id=user.id, db=db)
    except Exception as e:
        print(f"[Scan New] Analytics error (non-fatal): {e}")

    settings.last_scan_at = datetime.utcnow()
    db.commit()

    return result