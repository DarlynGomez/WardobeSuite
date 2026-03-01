# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, scan, review

# Create all SQLite tables on startup (safe to call repeatedly — skips existing tables)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WardrobeSuite API")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(scan.router, prefix="/scan", tags=["scan"])
app.include_router(review.router, prefix="/review-items", tags=["review"])

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok"}


# ── Shared auth dependency ────────────────────────────────────────────────────
from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Item, UserAnalytics

def _get_user(x_user_id: str = Header(...), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


# ── GET /items ────────────────────────────────────────────────────────────────
@app.get("/items")
def get_items(user: User = Depends(_get_user), db: Session = Depends(get_db)):
    """
    Returns all approved wardrobe items for this user.
    Frontend wardrobe grid + dashboard item count both use this.
    """
    items = (
        db.query(Item)
        .filter(Item.user_id == user.id)
        .order_by(Item.created_at.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "item_name": item.item_name,
            "merchant": item.merchant,
            "category": item.category,
            "size": item.size,
            "price_cents": item.price_cents,
            "currency": item.currency,
            "purchased_at": item.purchased_at.isoformat() if item.purchased_at else None,
            "wear_count": item.wear_count,
            "cost_per_wear_cents": item.price_cents // max(1, item.wear_count),
            "source": item.source,
            "image_url": item.image_url,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in items
    ]


# ── GET /analytics/summary ────────────────────────────────────────────────────
from datetime import datetime, timedelta

@app.get("/analytics/summary")
def analytics_summary(
    window_days: int = 90,
    user: User = Depends(_get_user),
    db: Session = Depends(get_db),
):
    """
    Returns spending aggregates for this user over the last N days.
    Also returns the precomputed UserAnalytics row (from emailparser).
    """
    cutoff = datetime.utcnow() - timedelta(days=window_days)

    items = db.query(Item).filter(
        Item.user_id == user.id,
        Item.created_at >= cutoff,
    ).all()

    # Pull precomputed analytics from emailparser
    analytics_row = db.query(UserAnalytics).filter(
        UserAnalytics.user_id == user.id
    ).first()

    if not items:
        return {
            "window_days": window_days,
            "total_spend_cents": 0,
            "item_count": 0,
            "avg_purchase_cents": analytics_row.average_purchase_cents if analytics_row else 0,
            "spend_by_category": [],
            "spend_by_month": [],
            "analytics": _serialize_analytics(analytics_row),
        }

    total = sum(i.price_cents for i in items)
    count = len(items)

    cat_totals: dict = {}
    for item in items:
        cat = item.category or "Other"
        if cat not in cat_totals:
            cat_totals[cat] = {"category": cat, "spend_cents": 0, "item_count": 0}
        cat_totals[cat]["spend_cents"] += item.price_cents
        cat_totals[cat]["item_count"] += 1

    month_totals: dict = {}
    for item in items:
        month = (item.purchased_at or item.created_at).strftime("%Y-%m")
        if month not in month_totals:
            month_totals[month] = {"month": month, "spend_cents": 0, "item_count": 0}
        month_totals[month]["spend_cents"] += item.price_cents
        month_totals[month]["item_count"] += 1

    return {
        "window_days": window_days,
        "total_spend_cents": total,
        "item_count": count,
        "avg_purchase_cents": total // count,
        "spend_by_category": sorted(cat_totals.values(), key=lambda x: -x["spend_cents"]),
        "spend_by_month": sorted(month_totals.values(), key=lambda x: x["month"]),
        "analytics": _serialize_analytics(analytics_row),
    }


def _serialize_analytics(row: UserAnalytics | None) -> dict:
    if row is None:
        return {}
    import json
    return {
        "total_spending_cents": row.total_spending_cents,
        "total_purchases": row.total_purchases,
        "average_purchase_cents": row.average_purchase_cents,
        "frequent_merchant": row.frequent_merchant,
        "frequent_merchant_amount": row.frequent_merchant_amount,
        "merchant_freq": json.loads(row.merchant_freq_json or "{}"),
        "most_spent_merchant": row.most_spent_merchant,
        "most_spent_merchant_amount": row.most_spent_merchant_amount,
        "merchant_spending": json.loads(row.merchant_spending_json or "{}"),
        "frequent_category": row.frequent_category,
        "frequent_category_amount": row.frequent_category_amount,
        "category_freq": json.loads(row.category_freq_json or "{}"),
        "most_spent_category": row.most_spent_category,
        "most_spent_category_amount": row.most_spent_category_amount,
        "category_spending": json.loads(row.category_spending_json or "{}"),
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }