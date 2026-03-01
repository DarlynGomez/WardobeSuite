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
from app.emailparser import parse_json

router = APIRouter()


def get_current_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {x_user_id} not found.")
    if not user.refresh_token:
        raise HTTPException(status_code=401, detail="No Gmail token. Complete OAuth first.")
    return user


class ScanInitialRequest(BaseModel):
    initial_scan_days: int


class ScanResponse(BaseModel):
    queued_count: int
    scanned_messages: int
    errors: int
    skipped_duplicates: int


def _process_emails_into_queue(emails: list[dict], user_id: str, db: Session) -> ScanResponse:
    queued = 0
    errors = 0
    skipped = 0

    for email in emails:
        msg_id = email["message_id"]

        # Skip whole email if already processed
        if db.query(ReviewQueueItem).filter(
            ReviewQueueItem.user_id == user_id,
            ReviewQueueItem.email_message_id == msg_id,
        ).first():
            skipped += 1
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

        seen_names: set[str] = set()
        images = email.get("image_urls", [])
        img_idx = 0

        for item in extraction.items:
            if not item.is_clothing:
                continue
            if item.confidence < CONFIDENCE_THRESHOLD:
                continue

            name_key = item.item_name.strip().lower()
            if name_key in seen_names:
                skipped += 1
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
            if not image_url and img_idx < len(images):
                image_url = images[img_idx]
                img_idx += 1

            db.add(ReviewQueueItem(
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
            ))

            try:
                db.commit()
                queued += 1
                seen_names.add(name_key)
            except IntegrityError:
                db.rollback()
                skipped += 1

    return ScanResponse(
        queued_count=queued,
        scanned_messages=len(emails),
        errors=errors,
        skipped_duplicates=skipped,
    )


@router.post("/initial")
def scan_initial(
    body: ScanInitialRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {30, 90, 180}
    if body.initial_scan_days not in allowed:
        raise HTTPException(status_code=400, detail=f"initial_scan_days must be one of {allowed}")

    after_date_str = (datetime.utcnow() - timedelta(days=body.initial_scan_days)).strftime("%Y/%m/%d")
    gmail_service = get_gmail_service(user.refresh_token)

    print(f"[Scan] User {user.email} | fetching emails after {after_date_str}")
    emails = fetch_emails(gmail_service, after_date_str, max_results=50)
    print(f"[Scan] Fetched {len(emails)} emails")

    result = _process_emails_into_queue(emails, user.id, db)

    try:
        parse_json(user_id=user.id, db=db)
        print(f"[Scan] Analytics updated")
    except Exception as e:
        print(f"[Scan] Analytics error (non-fatal): {e}")

    settings = db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first()
    if not settings:
        settings = ScanSettings(user_id=user.id)
        db.add(settings)
    settings.initial_scan_days = body.initial_scan_days
    settings.last_scan_at = datetime.utcnow()
    db.commit()

    print(f"[Scan] Done — queued={result.queued_count} errors={result.errors} dupes={result.skipped_duplicates}")
    return result


@router.post("/new")
def scan_new(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first()
    if not settings or not settings.last_scan_at:
        raise HTTPException(status_code=400, detail="Run /scan/initial first.")

    after_date_str = settings.last_scan_at.strftime("%Y/%m/%d")
    gmail_service = get_gmail_service(user.refresh_token)

    print(f"[Scan New] User {user.email} | fetching emails after {after_date_str}")
    emails = fetch_emails(gmail_service, after_date_str, max_results=50)
    result = _process_emails_into_queue(emails, user.id, db)

    try:
        parse_json(user_id=user.id, db=db)
    except Exception as e:
        print(f"[Scan New] Analytics error (non-fatal): {e}")

    settings.last_scan_at = datetime.utcnow()
    db.commit()

    return result