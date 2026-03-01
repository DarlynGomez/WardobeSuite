import hashlib
import os
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base, generate_uuid


class User(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True, default=generate_uuid)
    email         = Column(String, unique=True, nullable=False, index=True)
    first_name    = Column(String, nullable=True)
    last_name     = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    account_type  = Column(String, default="consumer")
    created_at    = Column(DateTime, default=datetime.utcnow)

    scan_settings = relationship("ScanSettings", back_populates="user", uselist=False)
    review_items  = relationship("ReviewQueueItem", back_populates="user")
    items         = relationship("Item", back_populates="user")

    def set_password(self, plaintext: str):
        salt = os.urandom(16).hex()
        hashed = hashlib.sha256(f"{salt}{plaintext}".encode()).hexdigest()
        self.password_hash = f"sha256:{salt}:{hashed}"

    def check_password(self, plaintext: str) -> bool:
        if not self.password_hash:
            return False
        try:
            _, salt, stored_hash = self.password_hash.split(":", 2)
            candidate = hashlib.sha256(f"{salt}{plaintext}".encode()).hexdigest()
            return candidate == stored_hash
        except ValueError:
            return False

    @property
    def full_name(self) -> str:
        parts = [self.first_name or "", self.last_name or ""]
        return " ".join(p for p in parts if p).strip() or self.email


class ScanSettings(Base):
    __tablename__ = "scan_settings"

    id                = Column(String, primary_key=True, default=generate_uuid)
    user_id           = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    initial_scan_days = Column(Integer, default=90)
    last_scan_at      = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="scan_settings")


class ReviewQueueItem(Base):
    __tablename__ = "review_queue_items"

    id               = Column(String, primary_key=True, default=generate_uuid)
    user_id          = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    source           = Column(String, default="gmail")
    status           = Column(String, default="pending")
    merchant         = Column(String, nullable=True)
    item_name        = Column(String, nullable=False)
    category         = Column(String, nullable=True)
    size             = Column(String, nullable=True)
    price_cents      = Column(Integer, nullable=True)
    currency         = Column(String, default="USD")
    purchased_at     = Column(DateTime, nullable=True)
    email_message_id = Column(String, nullable=True, index=True)
    email_thread_id  = Column(String, nullable=True)
    image_url        = Column(Text, nullable=True)
    extracted_json   = Column(JSON, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="review_items")


class UserAnalytics(Base):
    __tablename__ = "user_analytics"

    user_id                    = Column(String, ForeignKey("users.id"), primary_key=True, nullable=False)
    total_spending_cents       = Column(Integer, default=0)
    total_purchases            = Column(Integer, default=0)
    average_purchase_cents     = Column(Integer, default=0)
    frequent_merchant          = Column(String, nullable=True)
    frequent_merchant_amount   = Column(Integer, nullable=True)
    merchant_freq_json         = Column(Text, default="{}")
    most_spent_merchant        = Column(String, nullable=True)
    most_spent_merchant_amount = Column(Integer, nullable=True)
    merchant_spending_json     = Column(Text, default="{}")
    frequent_category          = Column(String, nullable=True)
    frequent_category_amount   = Column(Integer, nullable=True)
    category_freq_json         = Column(Text, default="{}")
    most_spent_category        = Column(String, nullable=True)
    most_spent_category_amount = Column(Integer, nullable=True)
    category_spending_json     = Column(Text, default="{}")
    updated_at                 = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Item(Base):
    __tablename__ = "items"

    id           = Column(String, primary_key=True, default=generate_uuid)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    merchant     = Column(String, nullable=True)
    item_name    = Column(String, nullable=False)
    category     = Column(String, nullable=True)
    size         = Column(String, nullable=True)
    color        = Column(String, nullable=True)
    price_cents  = Column(Integer, nullable=False)
    currency     = Column(String, default="USD")
    purchased_at = Column(DateTime, nullable=True)
    wear_count   = Column(Integer, default=0)
    source       = Column(String, default="gmail")
    image_url    = Column(Text, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="items")