# app/routers/scan.py
#
# WHY THIS FILE: Triggers Gmail scanning on demand.
# POST /scan/initial — first-time setup scan over N days
# POST /scan/new     — incremental scan since last scan time
#
# KEY CHANGES FROM V1:
# - _process_emails_into_queue now passes html_text, prices_found, image_urls
#   to Gemini so it has full context for price and image extraction
# - Deduplication fixed: now checks by (user_id, email_message_id, item_name)
#   using a Python-level check BEFORE insert, so SQLite's null handling
#   in unique indexes doesn't cause duplicate rows
# - First image URL from email is used as fallback if Gemini doesn't assign one

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

router = APIRouter()


# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    """
    Reads X-User-Id header and looks up the User row.
    Raises clear errors if the user doesn't exist or hasn't connected Gmail.
    """
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

    WHY NOT RELY ON THE DB UNIQUE INDEX FOR DEDUP: SQLite's unique index
    treats NULL as a unique value — so (user_id, msg_id, "Jeans", NULL) and
    (user_id, msg_id, "Jeans", NULL) are considered different rows because
    NULL != NULL. This caused duplicates when price_cents was null.
    We now check in Python instead.
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

        # Call Gemini with all available context:
        # plain text, HTML text, pre-extracted prices, and image URLs
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

        # Track which item names we've already inserted from this email
        # This prevents duplicates within a single email (e.g. if Gemini
        # returns the same item twice due to the email listing it in multiple places)
        inserted_names_this_email: set[str] = set()

        # Assign images to items in order if Gemini didn't assign them
        # (fallback: first image → first item, second image → second item, etc.)
        available_images = email.get("image_urls", [])
        image_index = 0

        for item in extraction.items:

            # Filter 1: must be a clothing item
            if not item.is_clothing:
                continue

            # Filter 2: must meet confidence threshold
            if item.confidence < CONFIDENCE_THRESHOLD:
                continue

            # LAYER 2 DEDUPE: Skip if we already inserted this item name
            # from this same email in this scan run
            normalized_name = item.item_name.strip().lower()
            if normalized_name in inserted_names_this_email:
                skipped_duplicates += 1
                continue

            # Convert price from dollars to cents
            price_cents: Optional[int] = None
            if item.price is not None:
                price_cents = int(round(item.price * 100))

            # Parse purchased_at date
            purchased_at: Optional[datetime] = None
            if item.purchased_at:
                try:
                    purchased_at = datetime.fromisoformat(item.purchased_at)
                except (ValueError, TypeError):
                    pass

            # Resolve image URL:
            # Use Gemini's assignment if it provided one, otherwise take
            # the next available image from the email's image list
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
                # Fallback: DB unique index caught a duplicate we missed
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
    Intended for first-time setup but safe to call multiple times
    (duplicates are handled at the Python level before any DB insert).
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

    settings.last_scan_at = datetime.utcnow()
    db.commit()

    return result