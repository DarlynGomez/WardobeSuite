# app/routers/review.py
#
# WHY THIS FILE EXISTS:
# The frontend swipe deck calls these three endpoints:
#   GET  /review-items           → load all pending cards
#   POST /review-items/{id}/approve → swipe right
#   POST /review-items/{id}/reject  → swipe left
#
# WHAT CHANGED FROM ANY PREVIOUS VERSION:
# 1. GET /review-items now includes "price_missing: bool" on every item.
#    Frontend uses this to show/hide the manual price input on the card.
#    SHEIN items always have price_missing=true because SHEIN emails
#    only show an order total, not per-item prices.
#
# 2. POST /review-items/{id}/approve now returns "wardrobe_item_id" in
#    its response. The frontend needs this to immediately add the approved
#    item to the local wardrobe state without doing a separate GET /items.

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import User, ReviewQueueItem, Item

router = APIRouter()


# ── Auth dependency (same pattern as scan.py) ─────────────────────────────────
def get_current_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {x_user_id} not found.")
    return user


# ── GET /review-items ─────────────────────────────────────────────────────────
@router.get("")
def list_review_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all pending ReviewQueueItems for this user, newest first.

    Each item includes:
      - price_missing: true when price_cents is null (SHEIN and similar retailers
        that don't show per-item prices in their emails). The frontend shows a
        price input field on those cards and blocks approve until it's filled.
      - All other fields the swipe card needs: name, merchant, image, category, date
    """
    pending_items = (
        db.query(ReviewQueueItem)
        .filter(
            ReviewQueueItem.user_id == user.id,
            ReviewQueueItem.status == "pending",
        )
        .order_by(ReviewQueueItem.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "source": item.source,
            "status": item.status,
            "merchant": item.merchant,
            "item_name": item.item_name,
            "category": item.category,
            "size": item.size if hasattr(item, 'size') else None,
            "price_cents": item.price_cents,
            # price_missing = True means the user MUST type a price before approving.
            # Frontend checks this field to decide whether to show the price input.
            "price_missing": item.price_cents is None,
            "currency": item.currency,
            "purchased_at": item.purchased_at.isoformat() if item.purchased_at else None,
            "image_url": item.image_url,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in pending_items
    ]


# ── Request body for approve ──────────────────────────────────────────────────
class ApproveBody(BaseModel):
    # All optional — frontend only sends these when user changed something
    edited_item_name: Optional[str] = None
    edited_price_cents: Optional[int] = None   # sent when price_missing=true
    edited_category: Optional[str] = None


# ── POST /review-items/{id}/approve ──────────────────────────────────────────
@router.post("/{item_id}/approve")
def approve_item(
    item_id: str,
    body: ApproveBody = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Moves a ReviewQueueItem into the approved Items table (the real wardrobe).

    Steps:
    1. Look up the ReviewQueueItem by id, scoped to this user
    2. Resolve the final price — use edited_price_cents if provided,
       else use the stored price_cents. Reject if neither exists.
    3. Create a new Item row (the wardrobe entry)
    4. Mark the ReviewQueueItem as approved so it won't show up again
    5. Return the new Item's id as wardrobe_item_id so the frontend can
       immediately add it to local state without a separate GET /items call

    WHY we return wardrobe_item_id:
    The frontend's handleSwipe() function adds the approved item to the
    wardrobeItems state array immediately (optimistic update). To do that
    it needs the new Item's UUID. Without this, the frontend would have to
    call GET /items after every approve, which is slower and causes a flash.
    """
    if body is None:
        body = ApproveBody()

    # Find the review item, scoped to this user for security
    review_item = db.query(ReviewQueueItem).filter(
        ReviewQueueItem.id == item_id,
        ReviewQueueItem.user_id == user.id,
    ).first()

    if not review_item:
        raise HTTPException(status_code=404, detail="Review item not found.")

    if review_item.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Item is already {review_item.status}."
        )

    # Resolve final price: edited value wins over stored value
    final_price_cents = body.edited_price_cents or review_item.price_cents
    if final_price_cents is None:
        # This blocks the approve if neither the email nor the user provided a price.
        # The frontend should have blocked this already (disabled approve button),
        # but we enforce it here too as a safety net.
        raise HTTPException(
            status_code=422,
            detail="price_cents is required. Pass edited_price_cents in the request body."
        )

    # Resolve final category
    final_category = body.edited_category or review_item.category or "Other"

    # Resolve final item name
    final_item_name = body.edited_item_name or review_item.item_name

    # Create the Item (approved wardrobe entry)
    new_item = Item(
        user_id=user.id,
        merchant=review_item.merchant,
        item_name=final_item_name,
        category=final_category,
        size=review_item.size if hasattr(review_item, 'size') else None,
        price_cents=final_price_cents,
        currency=review_item.currency or "USD",
        purchased_at=review_item.purchased_at,
        wear_count=0,
        source=review_item.source,
        image_url=review_item.image_url,
    )
    db.add(new_item)

    # Mark the queue item as done so it won't show up in future GET /review-items
    review_item.status = "approved"

    db.commit()
    db.refresh(new_item)

    # Return everything the frontend needs to update its local state immediately
    return {
        "success": True,
        "wardrobe_item_id": new_item.id,   # frontend uses this for optimistic update
        "item_name": new_item.item_name,
        "category": new_item.category,
        "price_cents": new_item.price_cents,
        "image_url": new_item.image_url,
        "merchant": new_item.merchant,
    }


# ── POST /review-items/{id}/reject ────────────────────────────────────────────
@router.post("/{item_id}/reject")
def reject_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Marks a ReviewQueueItem as rejected.
    It disappears from GET /review-items immediately (status != pending).
    The row stays in the DB for analytics (rejected items are still signal).
    """
    review_item = db.query(ReviewQueueItem).filter(
        ReviewQueueItem.id == item_id,
        ReviewQueueItem.user_id == user.id,
    ).first()

    if not review_item:
        raise HTTPException(status_code=404, detail="Review item not found.")

    review_item.status = "rejected"
    db.commit()

    return {"success": True}