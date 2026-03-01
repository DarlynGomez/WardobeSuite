# app/routers/business.py
#
# NEW FILE — Business-only endpoints.
# All endpoints require the caller to be a business account (role guard).
# Consumer data is anonymized before leaving this module (user_id is hashed).
#
# Endpoints:
#   GET  /business/analytics/table     → Paginated, filtered consumer analytics rows
#   GET  /business/analytics/export    → Download filtered rows as JSON (no PII)
#   POST /business/analytics/insights  → Send rows to Claude → markdown report
#   GET  /business/analytics/kpi       → Aggregated KPIs for the KPI dashboard tab

import hashlib
import json
import os
import re
from typing import Optional
from datetime import datetime, timedelta

import anthropic
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import get_db
from app.models import User, UserAnalytics

load_dotenv()

router = APIRouter()

# ── Anthropic client (reuse the same one from gemini_client.py pattern) ───────
_anthropic = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
_INSIGHTS_MODEL = "claude-sonnet-4-20250514"  # Sonnet for business insights


# ── Business auth guard ───────────────────────────────────────────────────────

def get_business_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that:
    1. Looks up the user by X-User-Id header
    2. Raises 403 if the account is not a business account

    This guard is applied to EVERY endpoint in this router.
    Consumer accounts cannot reach any of these endpoints.
    """
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if (user.role or "consumer") != "business":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Business account required."
        )
    return user


# ── Anonymization helper ──────────────────────────────────────────────────────

def _anonymize_user_id(user_id: str) -> str:
    """
    One-way hash of the user_id for business-facing output.
    We use SHA-256 truncated to 12 hex chars — visually distinct but not reversible.
    This keeps rows identifiable across API calls without exposing the real UUID.
    """
    return hashlib.sha256(user_id.encode()).hexdigest()[:12]


def _row_to_dict(row: UserAnalytics) -> dict:
    """
    Converts a UserAnalytics row to a business-safe dict.
    - user_id is anonymized (hashed)
    - No email, name, or any other PII is included
    - JSON columns are parsed from strings to dicts
    """
    merchant_freq    = {}
    merchant_spend   = {}
    category_freq    = {}
    category_spend   = {}

    try:
        if row.merchant_freq_json:
            merchant_freq = json.loads(row.merchant_freq_json)
    except (json.JSONDecodeError, TypeError):
        pass

    try:
        if row.merchant_spending_json:
            merchant_spend = json.loads(row.merchant_spending_json)
    except (json.JSONDecodeError, TypeError):
        pass

    try:
        if row.category_freq_json:
            category_freq = json.loads(row.category_freq_json)
    except (json.JSONDecodeError, TypeError):
        pass

    try:
        if row.category_spending_json:
            category_spend = json.loads(row.category_spending_json)
    except (json.JSONDecodeError, TypeError):
        pass

    return {
        "consumer_id": _anonymize_user_id(row.user_id),   # anonymized
        "total_spending_cents": row.total_spending_cents or 0,
        "total_purchases": row.total_purchases or 0,
        "average_purchase_cents": row.average_purchase_cents or 0,
        "frequent_merchant": row.frequent_merchant,
        "frequent_merchant_count": row.frequent_merchant_amount,
        "most_spent_merchant": row.most_spent_merchant,
        "most_spent_merchant_cents": row.most_spent_merchant_amount,
        "frequent_category": row.frequent_category,
        "frequent_category_count": row.frequent_category_amount,
        "most_spent_category": row.most_spent_category,
        "most_spent_category_cents": row.most_spent_category_amount,
        "merchant_freq": merchant_freq,
        "merchant_spend": merchant_spend,
        "category_freq": category_freq,
        "category_spend": category_spend,
        "first_purchase_at": row.first_purchase_at.isoformat() if row.first_purchase_at else None,
        "last_purchase_at": row.last_purchase_at.isoformat() if row.last_purchase_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _apply_filters(
    query,
    merchant: Optional[str] = None,
    category: Optional[str] = None,
    min_spending_cents: Optional[int] = None,
    min_purchases: Optional[int] = None,
):
    """Applies optional filter parameters to a UserAnalytics SQLAlchemy query."""
    if merchant:
        query = query.filter(UserAnalytics.frequent_merchant == merchant)
    if category:
        query = query.filter(UserAnalytics.frequent_category == category)
    if min_spending_cents is not None:
        query = query.filter(UserAnalytics.total_spending_cents >= min_spending_cents)
    if min_purchases is not None:
        query = query.filter(UserAnalytics.total_purchases >= min_purchases)
    return query


# ── GET /business/analytics/table ────────────────────────────────────────────

@router.get("/analytics/table")
def analytics_table(
    merchant: Optional[str] = Query(None, description="Filter by frequent_merchant"),
    category: Optional[str] = Query(None, description="Filter by frequent_category"),
    min_spending_cents: Optional[int] = Query(None, description="Minimum total_spending_cents"),
    min_purchases: Optional[int] = Query(None, description="Minimum total_purchases"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _user: User = Depends(get_business_user),
    db: Session = Depends(get_db),
):
    """
    Returns a paginated, filtered list of anonymized consumer analytics rows.

    Data source: UserAnalytics table (pre-aggregated by emailparser.parse_json)
    No raw ReviewQueueItems are queried here.
    No PII is returned — user_id is replaced with a one-way hash.

    Filters (all optional):
      merchant        → matches frequent_merchant exactly
      category        → matches frequent_category exactly
      min_spending_cents → total_spending_cents >= value
      min_purchases   → total_purchases >= value
    """
    query = db.query(UserAnalytics)
    query = _apply_filters(query, merchant, category, min_spending_cents, min_purchases)

    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "rows": [_row_to_dict(r) for r in rows],
    }


# ── GET /business/analytics/filter-options ───────────────────────────────────

@router.get("/analytics/filter-options")
def filter_options(
    _user: User = Depends(get_business_user),
    db: Session = Depends(get_db),
):
    """
    Returns all unique values for filter dropdowns in the business dashboard.
    Frontend calls this once on mount to populate filter <select> elements.
    """
    rows = db.query(UserAnalytics).all()

    merchants = sorted(set(r.frequent_merchant for r in rows if r.frequent_merchant))
    categories = sorted(set(r.frequent_category for r in rows if r.frequent_category))

    return {
        "merchants": merchants,
        "categories": categories,
    }


# ── GET /business/analytics/export ───────────────────────────────────────────

@router.get("/analytics/export")
def analytics_export(
    merchant: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_spending_cents: Optional[int] = Query(None),
    min_purchases: Optional[int] = Query(None),
    _user: User = Depends(get_business_user),
    db: Session = Depends(get_db),
):
    """
    Downloads all currently filtered rows as a structured JSON report.
    Same filters as /analytics/table but returns ALL matching rows (no pagination).

    The response is a JSON object with:
      - metadata: export timestamp, filter params, row count
      - consumers: array of anonymized consumer analytics rows

    Content-Disposition header triggers browser download.
    No PII is included — user_id is hashed.
    """
    query = db.query(UserAnalytics)
    query = _apply_filters(query, merchant, category, min_spending_cents, min_purchases)
    rows = query.all()

    export = {
        "metadata": {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "source": "WardrobeSuite Business Analytics",
            "filters_applied": {
                "merchant": merchant,
                "category": category,
                "min_spending_cents": min_spending_cents,
                "min_purchases": min_purchases,
            },
            "row_count": len(rows),
            "note": "Consumer identifiers are anonymized. No PII is included in this export.",
        },
        "consumers": [_row_to_dict(r) for r in rows],
    }

    filename = f"wardrobe-analytics-{datetime.utcnow().strftime('%Y%m%d-%H%M')}.json"

    return JSONResponse(
        content=export,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/json",
        },
    )


# ── POST /business/analytics/insights ────────────────────────────────────────

@router.post("/analytics/insights")
def generate_insights(
    merchant: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_spending_cents: Optional[int] = Query(None),
    min_purchases: Optional[int] = Query(None),
    _user: User = Depends(get_business_user),
    db: Session = Depends(get_db),
):
    """
    Sends the currently filtered consumer analytics rows to Claude
    and returns a structured markdown business intelligence report.

    The report includes:
      - Consumer segment insights
      - Brand loyalty analysis
      - Spend concentration patterns
      - Category saturation observations
      - Actionable recommendations

    Timeout note: This may take 5-15 seconds for large datasets.
    The frontend should show a loading state.
    """
    query = db.query(UserAnalytics)
    query = _apply_filters(query, merchant, category, min_spending_cents, min_purchases)
    rows = query.all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No analytics data found for the current filters. Try removing some filters."
        )

    # Build a compact summary for the prompt (don't send raw JSON blobs)
    consumer_summaries = []
    for r in rows[:100]:  # cap at 100 rows to stay within token limits
        freq_merch = {}
        try:
            freq_merch = json.loads(r.merchant_freq_json or "{}")
        except Exception:
            pass

        cat_spend = {}
        try:
            cat_spend = json.loads(r.category_spending_json or "{}")
        except Exception:
            pass

        consumer_summaries.append({
            "total_spend_usd": round((r.total_spending_cents or 0) / 100, 2),
            "purchases": r.total_purchases or 0,
            "avg_usd": round((r.average_purchase_cents or 0) / 100, 2),
            "top_merchant": r.frequent_merchant,
            "top_spend_merchant": r.most_spent_merchant,
            "top_category": r.frequent_category,
            "top_spend_category": r.most_spent_category,
            "merchant_breakdown": {k: v for k, v in list(freq_merch.items())[:5]},
            "category_spend_usd": {k: round(v / 100, 2) for k, v in list(cat_spend.items())[:5]},
        })

    # Compute aggregate stats for the prompt context
    total_consumers = len(rows)
    total_spend_usd = round(sum((r.total_spending_cents or 0) for r in rows) / 100, 2)
    avg_spend_usd = round(total_spend_usd / total_consumers, 2) if total_consumers else 0

    prompt = f"""You are a senior retail analytics consultant. Analyze this WardrobeSuite consumer purchase behavior dataset and produce a structured business intelligence report.

DATASET SUMMARY:
- Total consumers analyzed: {total_consumers}
- Total aggregate spend: ${total_spend_usd:,.2f}
- Average spend per consumer: ${avg_spend_usd:,.2f}
- Active filters: merchant={merchant or 'none'}, category={category or 'none'}, min_spend={min_spending_cents or 'none'}, min_purchases={min_purchases or 'none'}

CONSUMER DATA (up to 100 rows, each is one anonymized consumer):
{json.dumps(consumer_summaries, indent=2)}

Produce a detailed markdown business intelligence report with exactly these sections:

# WardrobeSuite Consumer Intelligence Report

## Executive Summary
[2-3 sentence summary of the most important findings]

## Consumer Segment Insights
[Identify 2-4 distinct consumer segments based on spend patterns, purchase frequency, and merchant preferences. Give each segment a descriptive name.]

## Brand Loyalty Analysis
[Which merchants appear most frequently? Are consumers loyal to single brands or multi-brand shoppers? What does the repeat-merchant data suggest about brand stickiness?]

## Spend Concentration Patterns
[Where is the money concentrated? Top merchants by revenue, top categories by spend, power user vs casual buyer distribution.]

## Category Saturation Observations
[Which categories are saturated vs underserved? What cross-category patterns exist? Wardrobe gap analysis.]

## Actionable Recommendations
[5 specific, numbered, data-driven recommendations for brands and retailers operating in this space]

---
*Report generated by WardrobeSuite Business Intelligence · {datetime.utcnow().strftime('%B %d, %Y')}*

Write the full report in professional business language. Be specific — cite actual numbers from the data. Avoid vague statements."""

    try:
        msg = _anthropic.messages.create(
            model=_INSIGHTS_MODEL,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        report_markdown = msg.content[0].text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Claude API error generating insights: {str(e)}"
        )

    return {
        "report": report_markdown,
        "consumers_analyzed": total_consumers,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


# ── GET /business/analytics/kpi ──────────────────────────────────────────────

@router.get("/analytics/kpi")
def analytics_kpi(
    _user: User = Depends(get_business_user),
    db: Session = Depends(get_db),
):
    """
    Returns all KPI data for the Strategic Intelligence dashboard tab.

    All computation happens HERE on the backend — frontend renders only.
    No analytics logic lives in the frontend.

    Returns:
      executive:    Aggregate totals and concentration ratios
      behavioral:   Repeat purchase indicator, top merchants, top categories
      predictive:   Churn risk score, purchase velocity trend
    """
    rows = db.query(UserAnalytics).all()

    if not rows:
        return {
            "consumer_count": 0,
            "executive": {},
            "behavioral": {},
            "predictive": {},
        }

    n = len(rows)

    # ── Executive Metrics ─────────────────────────────────────────────────────

    total_spending_cents = sum(r.total_spending_cents or 0 for r in rows)
    avg_spending_cents   = total_spending_cents // n if n else 0

    # Merchant concentration ratio: % of total spend going to the single top merchant
    all_merchant_spend: dict = {}
    for r in rows:
        try:
            ms = json.loads(r.merchant_spending_json or "{}")
            for merchant, cents in ms.items():
                all_merchant_spend[merchant] = all_merchant_spend.get(merchant, 0) + cents
        except Exception:
            pass

    top_merchant_spend = max(all_merchant_spend.values()) if all_merchant_spend else 0
    merchant_concentration = round(
        (top_merchant_spend / total_spending_cents * 100) if total_spending_cents else 0, 1
    )
    top_merchant_name = (
        max(all_merchant_spend, key=all_merchant_spend.get) if all_merchant_spend else None
    )

    # Category concentration ratio
    all_category_spend: dict = {}
    for r in rows:
        try:
            cs = json.loads(r.category_spending_json or "{}")
            for cat, cents in cs.items():
                all_category_spend[cat] = all_category_spend.get(cat, 0) + cents
        except Exception:
            pass

    top_category_spend = max(all_category_spend.values()) if all_category_spend else 0
    category_concentration = round(
        (top_category_spend / total_spending_cents * 100) if total_spending_cents else 0, 1
    )
    top_category_name = (
        max(all_category_spend, key=all_category_spend.get) if all_category_spend else None
    )

    # ── Behavioral Metrics ────────────────────────────────────────────────────

    # Repeat purchase indicator: % of consumers with >1 merchant (multi-brand)
    multi_brand_count = 0
    all_merchant_freq: dict = {}
    for r in rows:
        try:
            mf = json.loads(r.merchant_freq_json or "{}")
            if len(mf) > 1:
                multi_brand_count += 1
            for m, cnt in mf.items():
                all_merchant_freq[m] = all_merchant_freq.get(m, 0) + cnt
        except Exception:
            pass

    multi_brand_pct = round(multi_brand_count / n * 100, 1) if n else 0

    # Top 5 merchants by frequency (purchase count across all consumers)
    top_merchants_freq = sorted(
        [{"merchant": k, "count": v} for k, v in all_merchant_freq.items()],
        key=lambda x: -x["count"],
    )[:5]

    # Top 5 categories by total spend (dollars)
    top_categories_spend = sorted(
        [{"category": k, "spend_cents": v} for k, v in all_category_spend.items()],
        key=lambda x: -x["spend_cents"],
    )[:5]

    # ── Predictive-Like Metrics ───────────────────────────────────────────────

    # Churn risk: % of consumers whose last_purchase_at is > 60 days ago
    now = datetime.utcnow()
    churn_threshold = now - timedelta(days=60)
    churn_count = 0
    velocity_data = []  # (days_active, purchases) for velocity calculation

    for r in rows:
        if r.last_purchase_at and r.last_purchase_at < churn_threshold:
            churn_count += 1

        # Purchase velocity = purchases per 30 days of active period
        if r.first_purchase_at and r.last_purchase_at and r.total_purchases:
            days_active = max(1, (r.last_purchase_at - r.first_purchase_at).days)
            velocity = round((r.total_purchases / days_active) * 30, 2)
            velocity_data.append(velocity)

    churn_risk_pct = round(churn_count / n * 100, 1) if n else 0

    # Average purchase velocity (purchases per 30 days)
    avg_velocity = round(sum(velocity_data) / len(velocity_data), 2) if velocity_data else 0

    # Velocity distribution buckets for trend chart
    velocity_buckets = {
        "low (< 1/mo)": 0,
        "medium (1-3/mo)": 0,
        "high (3+/mo)": 0,
    }
    for v in velocity_data:
        if v < 1:
            velocity_buckets["low (< 1/mo)"] += 1
        elif v < 3:
            velocity_buckets["medium (1-3/mo)"] += 1
        else:
            velocity_buckets["high (3+/mo)"] += 1

    return {
        "consumer_count": n,
        "executive": {
            "total_spending_cents": total_spending_cents,
            "avg_spending_per_consumer_cents": avg_spending_cents,
            "merchant_concentration_pct": merchant_concentration,
            "category_concentration_pct": category_concentration,
            "top_merchant_by_spend": top_merchant_name,
            "top_category_by_spend": top_category_name,
        },
        "behavioral": {
            "multi_brand_shopper_pct": multi_brand_pct,
            "top_merchants_by_frequency": top_merchants_freq,
            "top_categories_by_spend": top_categories_spend,
        },
        "predictive": {
            "churn_risk_pct": churn_risk_pct,
            "churn_threshold_days": 60,
            "avg_purchase_velocity_per_30_days": avg_velocity,
            "velocity_distribution": [
                {"label": k, "count": v}
                for k, v in velocity_buckets.items()
            ],
        },
    }