# app/models.py
#
# WHY THIS FILE: Defines the 4 database tables as Python classes using
# SQLAlchemy's ORM (Object-Relational Mapper). Each class = one table.
# Each Column() = one column in that table.
#
# We import Base from database.py — inheriting from Base is what registers
# the class as a table with SQLAlchemy.

from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, Index
from sqlalchemy.sql import func

from app.database import Base, generate_uuid


# ─────────────────────────────────────────────────────────────────────────────
# TABLE 1: users
#
# WHY: We need to know WHO a review queue item belongs to, and we need to
# store their Gmail refresh token so we can scan their email later without
# asking them to log in again.
# ─────────────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    # Primary key — a random UUID string, e.g. "a3f2c1b0-..."
    # default=generate_uuid means SQLAlchemy calls generate_uuid() automatically
    # when you create a new User() without providing an id.
    id = Column(String, primary_key=True, default=generate_uuid)

    # The user's Gmail address, e.g. "alice@gmail.com"
    # unique=True means no two users can share an email address
    # nullable=False means this column cannot be empty
    email = Column(String, unique=True, nullable=False)

    # The Gmail OAuth refresh token. We store this so we can call Gmail API
    # later without the user having to log in again.
    # nullable=True because the token doesn't exist until after OAuth completes
    refresh_token = Column(Text, nullable=True)

    # Automatically set to the current timestamp when the row is created.
    # server_default=func.now() tells SQLite to use its own NOW() function
    # rather than sending the time from Python (avoids timezone drift).
    created_at = Column(DateTime, server_default=func.now())


# ─────────────────────────────────────────────────────────────────────────────
# TABLE 2: scan_settings
#
# WHY: We need to remember two things per user:
#   1. How many days back they scanned on first setup (30, 90, or 180)
#   2. When they last scanned (so "scan for new orders" knows where to start)
# ─────────────────────────────────────────────────────────────────────────────
class ScanSettings(Base):
    __tablename__ = "scan_settings"

    # user_id is both the primary key AND a foreign key reference to users.id
    # We keep it simple for the hackathon — no foreign key constraint declared,
    # but logically this always matches a users.id value.
    user_id = Column(String, primary_key=True)

    # How many days back the user chose to scan on first setup.
    # Default is 90 if not specified.
    initial_scan_days = Column(Integer, default=90)

    # When the most recent scan finished. Starts as NULL.
    # The /scan/new endpoint uses this to know what "new" means.
    # Nullable because the user hasn't scanned yet when the row is first created.
    last_scan_at = Column(DateTime, nullable=True)


# ─────────────────────────────────────────────────────────────────────────────
# TABLE 3: review_queue_items
#
# WHY: This is the holding area for items Gemini found in emails.
# The user reviews each one and either approves it (moves to Items table)
# or rejects it (stays here with status="rejected").
# ─────────────────────────────────────────────────────────────────────────────
class ReviewQueueItem(Base):
    __tablename__ = "review_queue_items"

    id = Column(String, primary_key=True, default=generate_uuid)

    # Which user this item belongs to
    user_id = Column(String, nullable=False, index=True)  # index speeds up lookups by user

    # Where did this item come from?
    # "gmail" = extracted from an email receipt
    # "camera" = added via photo (Developer 3 builds this; we just store the value)
    source = Column(String, nullable=False, default="gmail")

    # Current state of this item in the review process
    # "pending"  = user hasn't reviewed it yet
    # "approved" = user approved it; a corresponding row was created in Items
    # "rejected" = user said this isn't a real purchase
    status = Column(String, nullable=False, default="pending")

    # The store or brand name extracted from the email, e.g. "Zara", "ASOS"
    # Nullable because Gemini might not always find it
    merchant = Column(String, nullable=True)

    # The name of the clothing item, e.g. "Black Slim Fit Jeans"
    # NOT nullable — if Gemini can't find a name, we don't insert the row
    item_name = Column(String, nullable=False)

    # Gemini's guess at the category, e.g. "Bottoms", "Shoes"
    # Nullable because Gemini might not categorize it
    category = Column(String, nullable=True)

    # Price in cents (integer) to avoid floating point math errors.
    # e.g. $49.99 = 4999 cents
    # Nullable because Gemini might not find the price in the email
    price_cents = Column(Integer, nullable=True)

    # Currency code, e.g. "USD", "EUR". Defaults to USD for MVP.
    currency = Column(String, default="USD")

    # The date the item was purchased, if found in the email
    purchased_at = Column(DateTime, nullable=True)

    # The Gmail message ID, e.g. "18c3f7a2b1e4d5f6"
    # We use this for deduplication: if we've already processed this email,
    # we skip it rather than creating duplicate rows.
    email_message_id = Column(String, nullable=True)

    # The Gmail thread ID — useful if we want to group replies later
    email_thread_id = Column(String, nullable=True)

    # URL to a product image if Gemini found one in the email (e.g. from HTML)
    # Text (not String) because URLs can be very long
    image_url = Column(Text, nullable=True)

    # The raw JSON that Gemini returned. We store this so we can debug what
    # Gemini extracted without having to re-process the email.
    # JSON type stores a Python dict/list as a JSON string in SQLite.
    extracted_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    # DEDUPLICATION INDEX
    # WHY: If we scan the same email twice (e.g. user runs /scan/initial twice),
    # we don't want to create duplicate rows. This unique index forces SQLite
    # to reject an insert if the same (user_id, email_message_id, item_name,
    # price_cents) combination already exists.
    # The try/except in scan.py catches the resulting error and skips silently.
    __table_args__ = (
        Index(
            "ix_review_queue_dedupe",     # name of the index (must be unique)
            "user_id",
            "email_message_id",
            "item_name",
            "price_cents",
            unique=True,                  # makes it a unique constraint
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# TABLE 4: items
#
# WHY: Once a user approves a ReviewQueueItem, it moves here. This is the
# "ground truth" wardrobe. Developer 2 reads from this table to compute
# analytics. Developer 3 displays rows from this table.
# ─────────────────────────────────────────────────────────────────────────────
class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    merchant = Column(String, nullable=True)

    # NOT nullable — the approve endpoint enforces that item_name is always set
    item_name = Column(String, nullable=False)

    # NOT nullable — approve endpoint defaults to "Unknown" if blank
    category = Column(String, nullable=False, default="Unknown")

    # Optional color of the item, e.g. "Navy Blue"
    # Could be extracted from a camera photo later (Developer 3 scope)
    color = Column(String, nullable=True)

    # NOT nullable — approve endpoint requires a price before approving
    # If Gemini couldn't find the price, the frontend must enter it manually
    price_cents = Column(Integer, nullable=False)

    currency = Column(String, default="USD")
    purchased_at = Column(DateTime, nullable=True)

    # How many times the user has logged wearing this item.
    # Starts at 0. Developer 2 increments this via POST /items/{id}/wear.
    # Developer 2 also computes cost_per_wear = price_cents / max(1, wear_count)
    wear_count = Column(Integer, default=0)

    source = Column(String, default="gmail")   # "gmail" or "camera"
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())