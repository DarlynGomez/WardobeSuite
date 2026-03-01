from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, Index
from sqlalchemy.sql import func
from app.database import Base, generate_uuid


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    refresh_token = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ScanSettings(Base):
    __tablename__ = "scan_settings"
    user_id = Column(String, primary_key=True)
    initial_scan_days = Column(Integer, default=90)
    last_scan_at = Column(DateTime, nullable=True)


class ReviewQueueItem(Base):
    __tablename__ = "review_queue_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False, default="gmail")
    status = Column(String, nullable=False, default="pending")
    merchant = Column(String, nullable=True)
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    size = Column(String, nullable=True)        # ← NEW: e.g. "M", "L", "28x30", "8.5"
    price_cents = Column(Integer, nullable=True)
    currency = Column(String, default="USD")
    purchased_at = Column(DateTime, nullable=True)
    email_message_id = Column(String, nullable=True)
    email_thread_id = Column(String, nullable=True)
    image_url = Column(Text, nullable=True)
    extracted_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index(
            "ix_review_queue_dedupe",
            "user_id", "email_message_id", "item_name", "price_cents",
            unique=True,
        ),
    )


class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    merchant = Column(String, nullable=True)
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Unknown")
    color = Column(String, nullable=True)
    size = Column(String, nullable=True)        # ← NEW: e.g. "M", "L", "28x30", "8.5"
    price_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    purchased_at = Column(DateTime, nullable=True)
    wear_count = Column(Integer, default=0)
    source = Column(String, default="gmail")
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())