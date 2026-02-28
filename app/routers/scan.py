# app/routers/scan.py
#
# WHY THIS FILE: Provides two endpoints that trigger Gmail scanning:
#
# POST /scan/initial — called once on setup. The user picks how many days
#   back to scan (30, 90, 180). We fetch up to 50 matching emails, send each
#   to Gemini, and insert qualifying clothing items into ReviewQueueItems.
#
# POST /scan/new — called whenever the user wants to check for new orders.
#   We look at ScanSettings.last_scan_at and fetch only emails newer than that.
#   This keeps repeat scans fast because we skip already-processed emails.
#
# Authentication: All endpoints require the X-User-Id header.
# The user gets this user_id from the OAuth callback response.

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


# ── Shared dependency ─────────────────────────────────────────────────────────

def get_current_user(
    x_user_id: str = Header(...),   # "..." means the header is required
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that reads X-User-Id header and returns the User row.

    WHY A HEADER NOT A TOKEN: For hackathon speed. A proper implementation
    would use JWT tokens, but headers are easier to test with curl and don't
    require a login flow for every team member. The user_id is opaque (UUID)
    so it's not guessable.

    Usage in any route:
        def my_route(user: User = Depends(get_current_user)):
            ...

    Raises 404 if the user_id doesn't exist in the database.
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
    """Body for POST /scan/initial."""
    initial_scan_days: int  # Must be 30, 90, or 180


class ScanResponse(BaseModel):
    """Response for both scan endpoints."""
    queued_count: int       # How many new items were added to the review queue
    scanned_messages: int   # How many emails were fetched from Gmail
    errors: int             # How many emails failed Gemini extraction (skipped)
    skipped_duplicates: int # How many items were skipped because they already exist


# ── Core extraction logic (shared by both scan endpoints) ─────────────────────

def _process_emails_into_queue(
    emails: list[dict],
    user_id: str,
    db: Session,
) -> ScanResponse:
    """
    Loops over fetched emails, calls Gemini on each, and inserts qualifying
    items into ReviewQueueItems.

    WHY A SHARED FUNCTION: Both /scan/initial and /scan/new do the same thing
    after fetching emails — extract and insert. Extracting this into a function
    prevents copy-paste bugs and makes each endpoint cleaner.

    Args:
        emails: List of email dicts from fetch_emails()
        user_id: The user's ID for associating queue items
        db: Database session

    Returns:
        ScanResponse with counts for the API response
    """
    queued = 0
    errors = 0
    skipped_duplicates = 0
    scanned = len(emails)

    for email in emails:
        msg_id = email["message_id"]

        # DEDUPE CHECK 1: Skip this email entirely if we've already processed it.
        # WHY: If the user runs /scan/initial twice, we should not create
        # duplicate queue items. Checking by email_message_id is fast and reliable.
        already_processed = db.query(ReviewQueueItem).filter(
            ReviewQueueItem.user_id == user_id,
            ReviewQueueItem.email_message_id == msg_id,
        ).first()
        if already_processed:
            skipped_duplicates += 1
            continue

        # Send this email to Gemini for extraction.
        # extract_purchases_from_email returns None on any failure — we skip those.
        extraction = extract_purchases_from_email(
            subject=email["subject"],
            body=email["body"],
        )

        if extraction is None:
            # Gemini failed — log it and move on. Don't crash the whole scan.
            errors += 1
            continue

        # Loop over each item Gemini found in this email
        for item in extraction.items:

            # FILTER 1: Skip non-clothing items.
            # e.g. if someone ordered a phone case and a shirt in the same receipt,
            # we only want the shirt.
            if not item.is_clothing:
                continue

            # FILTER 2: Skip low-confidence items.
            # Gemini sometimes extracts items from marketing emails or order
            # confirmation footers. Low confidence = probably not a real purchase.
            if item.confidence < CONFIDENCE_THRESHOLD:
                continue

            # Convert price from dollars (float) to cents (int).
            # WHY CENTS: Integer math is exact. Float math has rounding errors.
            # e.g. $49.99 becomes 4999 cents, not 49.990000001 cents.
            price_cents: Optional[int] = None
            if item.price is not None:
                price_cents = int(round(item.price * 100))

            # Convert purchased_at string to a datetime object.
            # Gemini returns "YYYY-MM-DD" strings. We parse them but don't crash
            # if the format is unexpected.
            purchased_at: Optional[datetime] = None
            if item.purchased_at:
                try:
                    purchased_at = datetime.fromisoformat(item.purchased_at)
                except (ValueError, TypeError):
                    # If Gemini returns an unparseable date, just leave it null.
                    pass

            # Create the ReviewQueueItem row
            new_queue_item = ReviewQueueItem(
                user_id=user_id,
                source="gmail",           # hardcoded — scan always comes from gmail
                status="pending",         # starts pending, frontend approves/rejects
                merchant=extraction.merchant,
                item_name=item.item_name,
                category=item.category_guess,
                price_cents=price_cents,
                currency="USD",           # hardcoded for MVP
                purchased_at=purchased_at,
                email_message_id=msg_id,
                email_thread_id=email["thread_id"],
                image_url=item.image_url,
                # Store the full extraction result for debugging.
                # If a user reports wrong data, we can look at extracted_json
                # to see exactly what Gemini returned.
                extracted_json=extraction.dict(),
            )
            db.add(new_queue_item)

            try:
                # Attempt to commit this item.
                # WHY COMMIT PER ITEM (not per email): If one item fails the
                # unique constraint (duplicate), we want to still insert the
                # other items from the same email. Committing per item means
                # a failure on item 2 doesn't roll back item 1.
                db.commit()
                queued += 1
            except IntegrityError:
                # DEDUPE CHECK 2: The unique index rejected this insert because
                # the same (user_id, email_message_id, item_name, price_cents)
                # already exists. This is expected — skip silently.
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

    The user selects 30, 90, or 180 days on the onboarding screen.
    This endpoint is intended to be called once on first setup, but can be
    called again (duplicates are handled safely).

    Steps:
    1. Validate that initial_scan_days is 30, 90, or 180
    2. Compute the date N days ago
    3. Build an authenticated Gmail service using the stored refresh_token
    4. Fetch up to 50 emails matching purchase keywords after that date
    5. Send each email to Gemini, insert qualifying items into ReviewQueueItems
    6. Update ScanSettings.last_scan_at so /scan/new knows where to start next
    7. Return counts
    """
    allowed_days = {30, 90, 180}
    if body.initial_scan_days not in allowed_days:
        raise HTTPException(
            status_code=400,
            detail=f"initial_scan_days must be one of {allowed_days}"
        )

    # Compute the cutoff date: today minus N days
    after_date = datetime.utcnow() - timedelta(days=body.initial_scan_days)
    # Gmail's date filter format is "YYYY/MM/DD"
    after_date_str = after_date.strftime("%Y/%m/%d")

    # Build authenticated Gmail client using stored refresh token
    gmail_service = get_gmail_service(user.refresh_token)

    # Fetch matching emails (up to 50)
    print(f"[Scan] Fetching emails for user {user.email} after {after_date_str}")
    emails = fetch_emails(gmail_service, after_date_str, max_results=50)
    print(f"[Scan] Fetched {len(emails)} emails")

    # Extract and insert qualifying items
    result = _process_emails_into_queue(emails, user.id, db)

    # Update scan settings: save the scan window and mark this as the last scan time.
    # Next time /scan/new is called, it uses last_scan_at as the start date.
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

    This is a "check for new orders" button. The user clicks it to pick up
    any new purchase emails since they last scanned. It is not automatic —
    it only runs when the user triggers it.

    Requires that /scan/initial has been run at least once (to set last_scan_at).
    """
    # Look up when we last scanned
    settings = db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first()

    if not settings or not settings.last_scan_at:
        raise HTTPException(
            status_code=400,
            detail="No previous scan found. Run POST /scan/initial first to set up your scan history."
        )

    # Use last scan time as the cutoff date
    after_date_str = settings.last_scan_at.strftime("%Y/%m/%d")

    gmail_service = get_gmail_service(user.refresh_token)

    print(f"[Scan New] Fetching emails for user {user.email} after {after_date_str}")
    emails = fetch_emails(gmail_service, after_date_str, max_results=50)
    print(f"[Scan New] Fetched {len(emails)} emails")

    result = _process_emails_into_queue(emails, user.id, db)

    # Update last_scan_at to now so the next /scan/new starts from today
    settings.last_scan_at = datetime.utcnow()
    db.commit()

    return result