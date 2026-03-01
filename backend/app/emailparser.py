"""
emailparser.py

Computes and upserts analytics from ReviewQueueItems into UserAnalytics.
Called by scan.py after every scan.

Signature: parse_json(user_id: str, db: Session)
"""

import json
from sqlalchemy.orm import Session
from app.models import ReviewQueueItem, UserAnalytics


def parse_json(user_id: str, db: Session) -> None:
    items = (
        db.query(ReviewQueueItem)
        .filter(
            ReviewQueueItem.user_id == user_id,
            ReviewQueueItem.status != "rejected",
        )
        .all()
    )

    if not items:
        return

    total_cents = 0
    count = 0
    merchant_freq: dict = {}
    merchant_spend: dict = {}
    category_freq: dict = {}
    category_spend: dict = {}

    for item in items:
        merchant = item.merchant or "Unknown"
        category = item.category or "Other"
        cents = item.price_cents or 0

        merchant_freq[merchant] = merchant_freq.get(merchant, 0) + 1
        category_freq[category] = category_freq.get(category, 0) + 1
        merchant_spend[merchant] = merchant_spend.get(merchant, 0) + cents
        category_spend[category] = category_spend.get(category, 0) + cents

        count += 1
        total_cents += cents

    if count == 0:
        return

    avg = total_cents // count
    top_merchant_freq    = max(merchant_freq, key=merchant_freq.get)
    top_merchant_spend   = max(merchant_spend, key=merchant_spend.get)
    top_category_freq    = max(category_freq, key=category_freq.get)
    top_category_spend   = max(category_spend, key=category_spend.get)

    row = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()

    if row is None:
        row = UserAnalytics(user_id=user_id)
        db.add(row)

    row.total_spending_cents       = total_cents
    row.total_purchases            = count
    row.average_purchase_cents     = avg
    row.frequent_merchant          = top_merchant_freq
    row.frequent_merchant_amount   = merchant_freq[top_merchant_freq]
    row.merchant_freq_json         = json.dumps(merchant_freq)
    row.most_spent_merchant        = top_merchant_spend
    row.most_spent_merchant_amount = merchant_spend[top_merchant_spend]
    row.merchant_spending_json     = json.dumps(merchant_spend)
    row.frequent_category          = top_category_freq
    row.frequent_category_amount   = category_freq[top_category_freq]
    row.category_freq_json         = json.dumps(category_freq)
    row.most_spent_category        = top_category_spend
    row.most_spent_category_amount = category_spend[top_category_spend]
    row.category_spending_json     = json.dumps(category_spend)

    db.commit()