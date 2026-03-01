import json
from sqlalchemy.orm import Session
from app.models import ReviewQueueItem, UserAnalytics


def parse_json(user_id: str, db: Session):
    """
    Reads all non-rejected ReviewQueueItems for this user and
    computes/upserts aggregated analytics into UserAnalytics.
    Called after every scan so the table stays current.
    """

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

    purchase_amount_cents = 0
    num_purchases = 0
    merchant_freq_dict = {}
    merchant_spending_dict = {}
    category_freq_dict = {}
    category_spending_dict = {}

    for item in items:
        merchant = item.merchant or "Unknown"
        category = item.category or "Other"
        price_cents = item.price_cents or 0

        merchant_freq_dict[merchant] = merchant_freq_dict.get(merchant, 0) + 1
        category_freq_dict[category] = category_freq_dict.get(category, 0) + 1
        merchant_spending_dict[merchant] = merchant_spending_dict.get(merchant, 0) + price_cents
        category_spending_dict[category] = category_spending_dict.get(category, 0) + price_cents

        num_purchases += 1
        purchase_amount_cents += price_cents

    if num_purchases == 0:
        return

    average_purchase = purchase_amount_cents // num_purchases

    frequent_merchant = max(merchant_freq_dict, key=merchant_freq_dict.get)
    most_spent_merchant = max(merchant_spending_dict, key=merchant_spending_dict.get)
    frequent_category = max(category_freq_dict, key=category_freq_dict.get)
    most_spent_category = max(category_spending_dict, key=category_spending_dict.get)

    existing = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()

    if existing is None:
        row = UserAnalytics(
            user_id=user_id,
            total_spending_cents=purchase_amount_cents,
            total_purchases=num_purchases,
            average_purchase_cents=average_purchase,
            frequent_merchant=frequent_merchant,
            frequent_merchant_amount=merchant_freq_dict[frequent_merchant],
            merchant_freq_json=json.dumps(merchant_freq_dict),
            most_spent_merchant=most_spent_merchant,
            most_spent_merchant_amount=merchant_spending_dict[most_spent_merchant],
            merchant_spending_json=json.dumps(merchant_spending_dict),
            frequent_category=frequent_category,
            frequent_category_amount=category_freq_dict[frequent_category],
            category_freq_json=json.dumps(category_freq_dict),
            most_spent_category=most_spent_category,
            most_spent_category_amount=category_spending_dict[most_spent_category],
            category_spending_json=json.dumps(category_spending_dict),
        )
        db.add(row)
    else:
        existing.total_spending_cents = purchase_amount_cents
        existing.total_purchases = num_purchases
        existing.average_purchase_cents = average_purchase
        existing.frequent_merchant = frequent_merchant
        existing.frequent_merchant_amount = merchant_freq_dict[frequent_merchant]
        existing.merchant_freq_json = json.dumps(merchant_freq_dict)
        existing.most_spent_merchant = most_spent_merchant
        existing.most_spent_merchant_amount = merchant_spending_dict[most_spent_merchant]
        existing.merchant_spending_json = json.dumps(merchant_spending_dict)
        existing.frequent_category = frequent_category
        existing.frequent_category_amount = category_freq_dict[frequent_category]
        existing.category_freq_json = json.dumps(category_freq_dict)
        existing.most_spent_category = most_spent_category
        existing.most_spent_category_amount = category_spending_dict[most_spent_category]
        existing.category_spending_json = json.dumps(category_spending_dict)

    db.commit()