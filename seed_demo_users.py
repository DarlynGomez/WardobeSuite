#!/usr/bin/env python3
"""
seed_demo_users.py
==================
Creates 5 realistic fake consumer users with wardrobe items and analytics
for demoing the WardrobeSuite business dashboard.

Run from the project root:
    python seed_demo_users.py

The script is IDEMPOTENT — running it twice will skip users that already exist
(matched by email). Safe to re-run.

IMPORTANT — IMAGE FILES:
Each item below has an `image_filename` field. You need to add these image
files to your project's public/images folder so the frontend can display them.
The script will still seed the DB without the images; items will show a
placeholder until you add the photos.

Suggested free image sources: Unsplash, Pexels (download and rename).
"""

import os
import sys
import json
import hashlib
from datetime import datetime, timedelta

# Add project root to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base, generate_uuid
from app.models import User, ScanSettings, Item, UserAnalytics

# Create any missing tables first
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Color-coded terminal output ───────────────────────────────────────────────

def _ok(msg):   print(f"  ✓  {msg}")
def _skip(msg): print(f"  –  {msg} (already exists, skipping)")
def _info(msg): print(f"     {msg}")


# ── Demo users ────────────────────────────────────────────────────────────────
# Each user has:
#   - name, email, password (all fake)
#   - items: list of wardrobe items (5-15 per user)
#   - Each item has: name, category, price_dollars, merchant, image_filename
#
# IMAGE FILENAMES — add these to your frontend's public folder:
#   frontend/public/demo/
#
# File naming convention:  <first_name_lowercase>_<item_number>.jpg
# e.g. sofia_1.jpg, sofia_2.jpg, marcus_1.jpg, etc.

DEMO_USERS = [
    {
        "first_name": "Sofia",
        "last_name": "Reyes",
        "email": "sofia.reyes@demo.wardrobesuite.com",
        "password": "Demo1234!",
        "color_season": "True Autumn",
        "note": "Warm-toned, earth tones, loves boho chic",
        "items": [
            # Tops
            {"name": "Rust Linen Button-Down Shirt", "category": "Tops", "price": 58.00, "merchant": "Quince", "image_filename": "sofia_1.jpg"},
            {"name": "Ivory Ribbed Crop Tank", "category": "Tops", "price": 24.00, "merchant": "SHEIN", "image_filename": "sofia_2.jpg"},
            {"name": "Burnt Orange Flowy Blouse", "category": "Tops", "price": 42.00, "merchant": "Anthropologie", "image_filename": "sofia_3.jpg"},
            # Bottoms
            {"name": "Terracotta Wide-Leg Trousers", "category": "Bottoms", "price": 78.00, "merchant": "Quince", "image_filename": "sofia_4.jpg"},
            {"name": "Dark Wash Straight Leg Jeans", "category": "Bottoms", "price": 65.00, "merchant": "Madewell", "image_filename": "sofia_5.jpg"},
            {"name": "Camel Midi Wrap Skirt", "category": "Bottoms", "price": 55.00, "merchant": "Anthropologie", "image_filename": "sofia_6.jpg"},
            # Dresses
            {"name": "Boho Floral Maxi Dress", "category": "Dresses", "price": 89.00, "merchant": "Free People", "image_filename": "sofia_7.jpg"},
            {"name": "Olive Shirt Dress", "category": "Dresses", "price": 72.00, "merchant": "Quince", "image_filename": "sofia_8.jpg"},
            # Outerwear
            {"name": "Cognac Leather Moto Jacket", "category": "Outerwear", "price": 198.00, "merchant": "Madewell", "image_filename": "sofia_9.jpg"},
            # Footwear
            {"name": "Tan Suede Ankle Boots", "category": "Footwear", "price": 128.00, "merchant": "Madewell", "image_filename": "sofia_10.jpg"},
            {"name": "Brown Leather Sandals", "category": "Footwear", "price": 68.00, "merchant": "Quince", "image_filename": "sofia_11.jpg"},
        ],
        "days_ago_first": 180,
        "days_ago_last": 14,
    },
    {
        "first_name": "Marcus",
        "last_name": "Chen",
        "email": "marcus.chen@demo.wardrobesuite.com",
        "password": "Demo1234!",
        "color_season": "Dark Winter",
        "note": "High contrast, cool tones, minimalist streetwear",
        "items": [
            # Tops
            {"name": "Black Heavyweight Tee", "category": "Tops", "price": 38.00, "merchant": "Uniqlo", "image_filename": "marcus_1.jpg"},
            {"name": "Navy Cotton Oxford Shirt", "category": "Tops", "price": 55.00, "merchant": "Uniqlo", "image_filename": "marcus_2.jpg"},
            {"name": "Charcoal Crewneck Sweatshirt", "category": "Tops", "price": 62.00, "merchant": "Everlane", "image_filename": "marcus_3.jpg"},
            {"name": "White Slim Fit T-Shirt", "category": "Tops", "price": 22.00, "merchant": "Uniqlo", "image_filename": "marcus_4.jpg"},
            # Bottoms
            {"name": "Black Slim Chinos", "category": "Bottoms", "price": 68.00, "merchant": "Everlane", "image_filename": "marcus_5.jpg"},
            {"name": "Dark Indigo Selvedge Jeans", "category": "Bottoms", "price": 118.00, "merchant": "Madewell", "image_filename": "marcus_6.jpg"},
            {"name": "Navy Jogger Pants", "category": "Bottoms", "price": 49.00, "merchant": "Uniqlo", "image_filename": "marcus_7.jpg"},
            # Outerwear
            {"name": "Black Wool Overcoat", "category": "Outerwear", "price": 228.00, "merchant": "Everlane", "image_filename": "marcus_8.jpg"},
            {"name": "Navy Bomber Jacket", "category": "Outerwear", "price": 148.00, "merchant": "Uniqlo", "image_filename": "marcus_9.jpg"},
            # Footwear
            {"name": "White Low-Top Sneakers", "category": "Footwear", "price": 75.00, "merchant": "Everlane", "image_filename": "marcus_10.jpg"},
            {"name": "Black Chelsea Boots", "category": "Footwear", "price": 158.00, "merchant": "Madewell", "image_filename": "marcus_11.jpg"},
            {"name": "Grey Wool Dress Socks (3-pack)", "category": "Accessories", "price": 18.00, "merchant": "Uniqlo", "image_filename": "marcus_12.jpg"},
        ],
        "days_ago_first": 210,
        "days_ago_last": 7,
    },
    {
        "first_name": "Amara",
        "last_name": "Okafor",
        "email": "amara.okafor@demo.wardrobesuite.com",
        "password": "Demo1234!",
        "color_season": "True Spring",
        "note": "Bright, warm tones, colorful and playful style",
        "items": [
            # Tops
            {"name": "Coral Puff-Sleeve Blouse", "category": "Tops", "price": 36.00, "merchant": "SHEIN", "image_filename": "amara_1.jpg"},
            {"name": "Sunny Yellow Crop Top", "category": "Tops", "price": 18.00, "merchant": "SHEIN", "image_filename": "amara_2.jpg"},
            {"name": "Peach Ribbed Tank Set", "category": "Tops", "price": 29.00, "merchant": "SHEIN", "image_filename": "amara_3.jpg"},
            {"name": "Bright Green Satin Cami", "category": "Tops", "price": 22.00, "merchant": "SHEIN", "image_filename": "amara_4.jpg"},
            # Bottoms
            {"name": "Yellow Mini Skirt", "category": "Bottoms", "price": 28.00, "merchant": "SHEIN", "image_filename": "amara_5.jpg"},
            {"name": "Orange Flared Pants", "category": "Bottoms", "price": 35.00, "merchant": "SHEIN", "image_filename": "amara_6.jpg"},
            {"name": "White Denim Shorts", "category": "Bottoms", "price": 32.00, "merchant": "Madewell", "image_filename": "amara_7.jpg"},
            # Dresses
            {"name": "Coral Wrap Midi Dress", "category": "Dresses", "price": 52.00, "merchant": "Anthropologie", "image_filename": "amara_8.jpg"},
            {"name": "Yellow Sundress with Pockets", "category": "Dresses", "price": 44.00, "merchant": "SHEIN", "image_filename": "amara_9.jpg"},
            {"name": "Tropical Print Mini Dress", "category": "Dresses", "price": 38.00, "merchant": "SHEIN", "image_filename": "amara_10.jpg"},
            # Footwear
            {"name": "White Strappy Heeled Sandals", "category": "Footwear", "price": 58.00, "merchant": "SHEIN", "image_filename": "amara_11.jpg"},
            {"name": "Nude Platform Mules", "category": "Footwear", "price": 72.00, "merchant": "Steve Madden", "image_filename": "amara_12.jpg"},
            # Accessories
            {"name": "Gold Hoop Earrings Set", "category": "Accessories", "price": 24.00, "merchant": "SHEIN", "image_filename": "amara_13.jpg"},
            {"name": "Woven Straw Tote Bag", "category": "Accessories", "price": 45.00, "merchant": "Anthropologie", "image_filename": "amara_14.jpg"},
            {"name": "Colorful Beaded Bracelet Set", "category": "Accessories", "price": 16.00, "merchant": "SHEIN", "image_filename": "amara_15.jpg"},
        ],
        "days_ago_first": 90,
        "days_ago_last": 3,
    },
    {
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya.sharma@demo.wardrobesuite.com",
        "password": "Demo1234!",
        "color_season": "Soft Summer",
        "note": "Cool, muted tones, professional workwear style",
        "items": [
            # Tops
            {"name": "Dusty Rose Silk Blouse", "category": "Tops", "price": 88.00, "merchant": "Quince", "image_filename": "priya_1.jpg"},
            {"name": "Lavender Cotton Button-Up", "category": "Tops", "price": 55.00, "merchant": "Everlane", "image_filename": "priya_2.jpg"},
            {"name": "Soft Grey Cashmere Sweater", "category": "Tops", "price": 95.00, "merchant": "Quince", "image_filename": "priya_3.jpg"},
            # Bottoms
            {"name": "Slate Grey Tailored Trousers", "category": "Bottoms", "price": 98.00, "merchant": "Everlane", "image_filename": "priya_4.jpg"},
            {"name": "Dusty Blue Midi Pencil Skirt", "category": "Bottoms", "price": 75.00, "merchant": "Quince", "image_filename": "priya_5.jpg"},
            {"name": "Mauve Wide-Leg Pants", "category": "Bottoms", "price": 82.00, "merchant": "Everlane", "image_filename": "priya_6.jpg"},
            # Dresses
            {"name": "Soft Lilac Sheath Dress", "category": "Dresses", "price": 118.00, "merchant": "Quince", "image_filename": "priya_7.jpg"},
            {"name": "Blush Pink Wrap Dress", "category": "Dresses", "price": 95.00, "merchant": "Anthropologie", "image_filename": "priya_8.jpg"},
            # Outerwear
            {"name": "Soft Grey Blazer", "category": "Outerwear", "price": 148.00, "merchant": "Everlane", "image_filename": "priya_9.jpg"},
            {"name": "Dusty Rose Trench Coat", "category": "Outerwear", "price": 188.00, "merchant": "Quince", "image_filename": "priya_10.jpg"},
            # Footwear
            {"name": "Nude Block-Heel Pumps", "category": "Footwear", "price": 112.00, "merchant": "Steve Madden", "image_filename": "priya_11.jpg"},
            {"name": "Taupe Leather Loafers", "category": "Footwear", "price": 128.00, "merchant": "Quince", "image_filename": "priya_12.jpg"},
        ],
        "days_ago_first": 150,
        "days_ago_last": 30,
    },
    {
        "first_name": "Jordan",
        "last_name": "Rivera",
        "email": "jordan.rivera@demo.wardrobesuite.com",
        "password": "Demo1234!",
        "color_season": "Bright Winter",
        "note": "Bold contrasts, androgynous streetwear, loves sneakers",
        "items": [
            # Tops
            {"name": "Oversized Black Graphic Tee", "category": "Tops", "price": 32.00, "merchant": "Urban Outfitters", "image_filename": "jordan_1.jpg"},
            {"name": "Electric Blue Color-Block Hoodie", "category": "Tops", "price": 68.00, "merchant": "Urban Outfitters", "image_filename": "jordan_2.jpg"},
            {"name": "White Button-Front Crop Top", "category": "Tops", "price": 28.00, "merchant": "SHEIN", "image_filename": "jordan_3.jpg"},
            {"name": "Cobalt Blue Rugby Polo", "category": "Tops", "price": 55.00, "merchant": "Uniqlo", "image_filename": "jordan_4.jpg"},
            # Bottoms
            {"name": "Black Cargo Pants", "category": "Bottoms", "price": 72.00, "merchant": "Urban Outfitters", "image_filename": "jordan_5.jpg"},
            {"name": "Bright Red Track Pants", "category": "Bottoms", "price": 48.00, "merchant": "Urban Outfitters", "image_filename": "jordan_6.jpg"},
            {"name": "Black Denim Mini Skirt", "category": "Bottoms", "price": 42.00, "merchant": "SHEIN", "image_filename": "jordan_7.jpg"},
            # Outerwear
            {"name": "Black Puffer Vest", "category": "Outerwear", "price": 88.00, "merchant": "Uniqlo", "image_filename": "jordan_8.jpg"},
            {"name": "Bright Royal Blue Windbreaker", "category": "Outerwear", "price": 95.00, "merchant": "Urban Outfitters", "image_filename": "jordan_9.jpg"},
            # Footwear
            {"name": "White High-Top Platform Sneakers", "category": "Footwear", "price": 95.00, "merchant": "Steve Madden", "image_filename": "jordan_10.jpg"},
            {"name": "Black Chunky Lug-Sole Boots", "category": "Footwear", "price": 138.00, "merchant": "Urban Outfitters", "image_filename": "jordan_11.jpg"},
            {"name": "Neon Green Slides", "category": "Footwear", "price": 38.00, "merchant": "SHEIN", "image_filename": "jordan_12.jpg"},
            # Accessories
            {"name": "Black Leather Belt Bag", "category": "Accessories", "price": 45.00, "merchant": "Urban Outfitters", "image_filename": "jordan_13.jpg"},
            {"name": "Silver Chain Necklace", "category": "Accessories", "price": 28.00, "merchant": "SHEIN", "image_filename": "jordan_14.jpg"},
        ],
        "days_ago_first": 120,
        "days_ago_last": 2,
    },
]

# ── Seed logic ────────────────────────────────────────────────────────────────

def _compute_analytics(user_id: str, items: list) -> UserAnalytics:
    """Build a UserAnalytics row from a list of seeded items."""
    from collections import defaultdict

    merchant_freq: dict = defaultdict(int)
    merchant_spend: dict = defaultdict(int)
    category_freq: dict = defaultdict(int)
    category_spend: dict = defaultdict(int)

    total_cents = 0
    dates = []

    for item in items:
        pc = round(item["price"] * 100)
        m = item["merchant"]
        c = item["category"]
        d = item.get("_purchased_at", datetime.utcnow())

        total_cents += pc
        dates.append(d)
        merchant_freq[m] += 1
        merchant_spend[m] += pc
        category_freq[c] += 1
        category_spend[c] += pc

    n = len(items)
    avg = total_cents // n if n else 0

    top_freq_m = max(merchant_freq, key=merchant_freq.get) if merchant_freq else None
    top_spend_m = max(merchant_spend, key=merchant_spend.get) if merchant_spend else None
    top_freq_c = max(category_freq, key=category_freq.get) if category_freq else None
    top_spend_c = max(category_spend, key=category_spend.get) if category_spend else None

    return UserAnalytics(
        user_id=user_id,
        total_spending_cents=total_cents,
        total_purchases=n,
        average_purchase_cents=avg,
        frequent_merchant=top_freq_m,
        frequent_merchant_amount=merchant_freq.get(top_freq_m, 0),
        merchant_freq_json=json.dumps(dict(merchant_freq)),
        most_spent_merchant=top_spend_m,
        most_spent_merchant_amount=merchant_spend.get(top_spend_m, 0),
        merchant_spending_json=json.dumps(dict(merchant_spend)),
        frequent_category=top_freq_c,
        frequent_category_amount=category_freq.get(top_freq_c, 0),
        category_freq_json=json.dumps(dict(category_freq)),
        most_spent_category=top_spend_c,
        most_spent_category_amount=category_spend.get(top_spend_c, 0),
        category_spending_json=json.dumps(dict(category_spend)),
        first_purchase_at=min(dates) if dates else None,
        last_purchase_at=max(dates) if dates else None,
        updated_at=datetime.utcnow(),
    )


def seed():
    print(f"\n{'='*60}")
    print("  WardrobeSuite — Seeding Demo Users")
    print(f"{'='*60}\n")

    seeded_count = 0
    skipped_count = 0

    for ud in DEMO_USERS:
        email = ud["email"]
        print(f"► {ud['first_name']} {ud['last_name']} ({email})")

        # Check if already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            _skip(f"User already in DB (id={existing.id[:8]}…)")
            skipped_count += 1
            continue

        # Create user
        user = User(
            email=email,
            first_name=ud["first_name"],
            last_name=ud["last_name"],
            role="consumer",
        )
        user.set_password(ud["password"])
        db.add(user)
        db.flush()  # get user.id

        # Create ScanSettings (marks Gmail as connected for demo purposes)
        ss = ScanSettings(user_id=user.id, initial_scan_days=90, last_scan_at=datetime.utcnow())
        db.add(ss)

        # Spread purchases over time
        total_days = ud["days_ago_first"] - ud["days_ago_last"]
        n_items = len(ud["items"])

        seeded_items = []
        for i, item_data in enumerate(ud["items"]):
            # Spread purchases evenly between first and last day
            frac = i / max(1, n_items - 1)
            days_offset = ud["days_ago_first"] - round(frac * total_days)
            purchased_at = datetime.utcnow() - timedelta(days=days_offset)

            item = Item(
                user_id=user.id,
                merchant=item_data["merchant"],
                item_name=item_data["name"],
                category=item_data["category"],
                price_cents=round(item_data["price"] * 100),
                currency="USD",
                purchased_at=purchased_at,
                wear_count=max(0, (180 - days_offset) // 14),  # rough wear estimate
                source="demo",
                image_url=f"demo/{item_data['image_filename']}",  # relative to public folder
            )
            db.add(item)
            seeded_items.append({**item_data, "_purchased_at": purchased_at})

        _ok(f"Created user (id={user.id[:8]}…)")
        _ok(f"Created {n_items} wardrobe items")

        # Print image filenames for this user
        _info(f"Image files needed (add to frontend/public/demo/):")
        for item_data in ud["items"]:
            _info(f"  • {item_data['image_filename']}  ←  {item_data['name']}")

        # Create UserAnalytics row (for business dashboard)
        existing_analytics = db.query(UserAnalytics).filter(
            UserAnalytics.user_id == user.id
        ).first()
        if not existing_analytics:
            analytics = _compute_analytics(user.id, seeded_items)
            db.add(analytics)
            _ok(f"Created UserAnalytics row")

        db.commit()
        seeded_count += 1
        print()

    print(f"{'='*60}")
    print(f"  Done. Seeded {seeded_count} users, skipped {skipped_count}.")
    print(f"{'='*60}\n")

    # Print credentials summary
    print("DEMO CREDENTIALS (for testing):")
    print(f"{'─'*50}")
    for ud in DEMO_USERS:
        print(f"  Email:    {ud['email']}")
        print(f"  Password: {ud['password']}")
        print(f"  Season:   {ud['color_season']}  |  Style: {ud['note']}")
        print()


if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()