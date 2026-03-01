# app/main.py
#
# WHY CORS IS REQUIRED:
# Your frontend runs at http://localhost:5173 (Vite's default port).
# Your backend runs at http://localhost:8000.
# Browsers block cross-origin requests by default — this is called CORS.
# Without these headers, every fetch() in App.tsx silently fails with:
#   "Access to fetch at 'http://localhost:8000/...' has been blocked by CORS policy"
#
# The CORSMiddleware below tells the browser:
#   "Yes, requests from localhost:5173 are allowed to hit this server"
#
# allow_origins=["*"] means ANY origin is allowed.
# For a hackathon this is fine. In production you'd list specific domains.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, scan, review

# Create all SQLite tables on startup (safe to call repeatedly — skips existing tables)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WardrobeSuite API")

# ── CORS ──────────────────────────────────────────────────────────────────────
# This MUST be added before any routes are registered.
# allow_origins=["*"]         → accept requests from any domain (fine for hackathon)
# allow_credentials=True      → allow cookies/auth headers
# allow_methods=["*"]         → allow GET, POST, PUT, DELETE, OPTIONS, etc.
# allow_headers=["*"]         → allow any header, including our custom X-User-Id
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth/google", tags=["auth"])
app.include_router(scan.router, prefix="/scan", tags=["scan"])
app.include_router(review.router, prefix="/review-items", tags=["review"])

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok"}


# ── GET /items ─────────────────────────────────────────────────────────────────
# WHY HERE AND NOT IN A ROUTER:
# Items is a simple read endpoint needed by the frontend wardrobe view.
# It reads the Items table (approved wardrobe items only) and returns
# them with cost_per_wear_cents computed inline.
#
# The frontend wardrobe grid and dashboard item count both use this endpoint.
from fastapi import Header, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Item

def _get_user(x_user_id: str = Header(...), db: Session = Depends(get_db)) -> User:
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

@app.get("/items")
def get_items(user: User = Depends(_get_user), db: Session = Depends(get_db)):
    """
    Returns all approved wardrobe items for this user.

    Includes cost_per_wear_cents computed as price_cents / max(1, wear_count).
    If wear_count is 0, cost_per_wear equals price (you've worn it 0 times
    so the full price is your "cost per wear" so far).

    Frontend uses this for:
    - The wardrobe grid (name, image, category, price)
    - The dashboard wardrobe item count
    """
    items = db.query(Item).filter(Item.user_id == user.id).order_by(Item.created_at.desc()).all()
    return [
        {
            "id": item.id,
            "item_name": item.item_name,
            "merchant": item.merchant,
            "category": item.category,
            "size": item.size if hasattr(item, 'size') else None,
            "price_cents": item.price_cents,
            "currency": item.currency,
            "purchased_at": item.purchased_at.isoformat() if item.purchased_at else None,
            "wear_count": item.wear_count,
            # cost_per_wear: the "true cost" of owning this item per use
            # After 10 wears, a $100 item costs $10/wear. Before any wears, $100/wear.
            "cost_per_wear_cents": item.price_cents // max(1, item.wear_count),
            "source": item.source,
            "image_url": item.image_url,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in items
    ]


# ── GET /analytics/summary ────────────────────────────────────────────────────
# Frontend profile screen uses avg_purchase_cents for the "historical spend" display.
# Frontend could also use total_spend_cents for a spending dashboard.
from datetime import datetime, timedelta

@app.get("/analytics/summary")
def analytics_summary(
    window_days: int = 90,
    user: User = Depends(_get_user),
    db: Session = Depends(get_db),
):
    """
    Returns spending aggregates for this user over the last N days.

    window_days: 30, 90, or 180 (default 90)

    Frontend uses:
    - avg_purchase_cents → profile screen "historical spend" display
    - total_spend_cents  → could power a spending dashboard card
    - item_count         → how many items purchased in the window
    - spend_by_category  → category breakdown for charts
    """
    cutoff = datetime.utcnow() - timedelta(days=window_days)

    items = db.query(Item).filter(
        Item.user_id == user.id,
        Item.created_at >= cutoff,
    ).all()

    if not items:
        return {
            "window_days": window_days,
            "total_spend_cents": 0,
            "item_count": 0,
            "avg_purchase_cents": 0,
            "spend_by_category": [],
            "spend_by_month": [],
        }

    total = sum(i.price_cents for i in items)
    count = len(items)

    # Category breakdown
    cat_totals: dict = {}
    for item in items:
        cat = item.category or "Other"
        if cat not in cat_totals:
            cat_totals[cat] = {"category": cat, "spend_cents": 0, "item_count": 0}
        cat_totals[cat]["spend_cents"] += item.price_cents
        cat_totals[cat]["item_count"] += 1

    # Month breakdown
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
    }