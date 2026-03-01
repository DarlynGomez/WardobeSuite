from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ReviewQueueItem, Item

router = APIRouter()


def get_current_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    """
    Reads X-User-Id header and returns the User row.
    Raises 404 if the user doesn't exist.
    (Same logic as in scan.py — in a bigger project we'd put this in a
    shared auth.py dependency module, but for hackathon clarity we repeat it.)
    """
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User {x_user_id} not found."
        )
    return user

class ApproveRequest(BaseModel):
    """
    Optional body for the approve endpoint.
    The frontend can send corrections if Gemini extracted wrong data.
    All fields are optional — if not sent, we use whatever Gemini found.
    """
    # Override the item name if Gemini got it wrong
    edited_item_name: Optional[str] = None
    # Override the price if Gemini missed it or got it wrong (in cents)
    edited_price_cents: Optional[int] = None
    # Override the category if Gemini categorized it wrong
    edited_category: Optional[str] = None

@router.get("/review-items")
def list_review_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all pending review queue items for this user, newest first.

    WHY ONLY PENDING: The frontend only shows items the user hasn't decided
    on yet. Approved and rejected items don't need to appear in the queue.

    Response: a list of item dicts (not raw SQLAlchemy objects, because
    FastAPI can't serialize SQLAlchemy objects directly).
    """
    pending_items = (
        db.query(ReviewQueueItem)
        .filter(
            ReviewQueueItem.user_id == user.id,
            ReviewQueueItem.status == "pending",
        )
        .order_by(ReviewQueueItem.created_at.desc()) # newest first
        .all()
    )

    # Serialize to dicts manually
    return [
        {
            "id": item.id,
            "source": item.source,
            "status": item.status,
            "merchant": item.merchant,
            "item_name": item.item_name,
            "category": item.category,
            "price_cents": item.price_cents,
            "size": item.size,
            "price_missing": item.price_cents is None,
            "currency": item.currency,
            "purchased_at": item.purchased_at.isoformat() if item.purchased_at else None,
            "image_url": item.image_url,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in pending_items
    ]


@router.post("/review-items/{item_id}/approve")
def approve_review_item(
    item_id: str,
    # ApproveRequest is optional — if the frontend sends no body, defaults apply
    body: ApproveRequest = ApproveRequest(),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Approves a review queue item:
    1. Validates it exists, belongs to this user, and is still pending
    2. Applies any edits from the frontend (name, price, category)
    3. Enforces that price_cents is not null (required for analytics)
    4. Creates a new row in the Items (wardrobe) table
    5. Marks the ReviewQueueItem status as "approved"

    WHY CREATE A NEW ROW IN ITEMS: The Items table is the clean, analytics-ready
    table. ReviewQueueItems is the raw queue. Keeping them separate means
    Developer 2 reads from a table that only has confirmed purchases.
    """
    # Look up the item — it must exist, belong to this user, and be pending
    queue_item = (
        db.query(ReviewQueueItem)
        .filter(
            ReviewQueueItem.id == item_id,
            ReviewQueueItem.user_id == user.id,
            ReviewQueueItem.status == "pending",  # can't approve an already-approved item
        )
        .first()
    )

    if not queue_item:
        raise HTTPException(
            status_code=404,
            detail=f"Pending review item {item_id} not found. It may not exist, belong to a different user, or already be approved/rejected."
        )

    # Apply edits from the frontend, falling back to what Gemini found
    final_name = body.edited_item_name or queue_item.item_name
    final_category = body.edited_category or queue_item.category or "Unknown"
    # For price: prefer frontend's edited value, then Gemini's value
    final_price_cents = (
        body.edited_price_cents
        if body.edited_price_cents is not None
        else queue_item.price_cents
    )

    if final_price_cents is None:
        raise HTTPException(
            status_code=422,
            detail="Cannot approve: price_cents is required. Send 'edited_price_cents' in the request body with the price in cents (e.g. 4999 for $49.99)."
        )

    # Create the wardrobe item row
    wardrobe_item = Item(
        user_id=user.id,
        merchant=queue_item.merchant,
        item_name=final_name,
        category=final_category,
        price_cents=final_price_cents,
        currency=queue_item.currency,
        purchased_at=queue_item.purchased_at,
        source=queue_item.source,          # preserves "gmail" or "camera"
        image_url=queue_item.image_url,
        wear_count=0,                       # always starts at 0 — user hasn't worn it yet
        # color is left null — can be filled later via camera flow (Developer 3)
    )
    db.add(wardrobe_item)

    # Mark the queue item as approved so it disappears from the pending list
    queue_item.status = "approved"

    # Commit both changes atomically.
    # WHY ONE COMMIT: If the wardrobe item insert succeeds but the status update
    # fails (extremely unlikely), we'd have an inconsistency. One commit means
    # both succeed or both fail.
    db.commit()
    db.refresh(wardrobe_item)  # reload from DB to get the server-generated created_at

    return {
        "approved": True,
        "wardrobe_item_id": wardrobe_item.id,
        "item_name": wardrobe_item.item_name,
        "category": wardrobe_item.category,
        "price_cents": wardrobe_item.price_cents,
        "merchant": wardrobe_item.merchant,
    }


@router.post("/review-items/{item_id}/reject")
def reject_review_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Rejects a review queue item.

    Sets status to "rejected" so it no longer appears in the pending list.
    The row stays in the database (we don't delete it) because:
    1. We might want to undo a rejection later
    2. The email_message_id is still needed for deduplication on future scans
    """
    queue_item = (
        db.query(ReviewQueueItem)
        .filter(
            ReviewQueueItem.id == item_id,
            ReviewQueueItem.user_id == user.id,
            ReviewQueueItem.status == "pending",
        )
        .first()
    )

    if not queue_item:
        raise HTTPException(
            status_code=404,
            detail=f"Pending review item {item_id} not found."
        )

    queue_item.status = "rejected"
    db.commit()

    return {
        "rejected": True,
        "item_id": item_id,
    }