"""
gemini_client.py  ←  kept the filename so scan.py import doesn't break

WHY WE SWITCHED: Gemini's API was timing out constantly and throwing 404s
as model names got deprecated. This file now uses the Anthropic Claude API
(claude-haiku-4-5-20251001) which is fast, cheap, and returns clean JSON.

The public interface is identical to what scan.py already expects:
  - extract_purchases_from_email(...)  → Optional[ExtractedEmail]
  - CONFIDENCE_THRESHOLD
  - ExtractedEmail, ExtractedItem  (same Pydantic shapes)
"""

import os
import json
import re
from typing import Optional
from enum import Enum

import anthropic
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
_MODEL = "claude-haiku-4-5-20251001"

CONFIDENCE_THRESHOLD = 0.65


# ── Output types (unchanged from before so scan.py keeps working) ─────────────

class Category(str, Enum):
    TOPS = "Tops"
    BOTTOMS = "Bottoms"
    OUTERWEAR = "Outerwear"
    SHOES = "Shoes"
    ACCESSORIES = "Accessories"
    OTHER = "Other"


class ExtractedItem(BaseModel):
    item_name: str
    price: Optional[float] = None
    purchased_at: Optional[str] = None
    image_url: Optional[str] = None
    category_guess: Optional[Category] = None
    size: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    is_clothing: bool = False


class ExtractedEmail(BaseModel):
    merchant: Optional[str] = None
    items: list[ExtractedItem] = []


# ── Prompt ────────────────────────────────────────────────────────────────────

_SYSTEM = """\
You are a shopping receipt parser. Given an order confirmation email, extract every clothing item purchased.

Respond with ONLY a raw JSON object — no markdown fences, no explanation.

Format:
{
  "merchant": "Store name or null",
  "items": [
    {
      "item_name": "Short clean name (max 60 chars, no marketing spam)",
      "price": 29.99,
      "purchased_at": "YYYY-MM-DD",
      "image_url": "https://... or null",
      "category_guess": "Tops|Bottoms|Outerwear|Shoes|Accessories|Other",
      "size": "M or null",
      "confidence": 0.95,
      "is_clothing": true
    }
  ]
}

Rules:
- is_clothing=true: clothing, shoes, bags, jewelry, hats, belts, socks, underwear, swimwear
- is_clothing=false: electronics, food, gift cards, home goods, hair clips, candles
- price: only use values from the "Pre-extracted prices" list. null if unsure.
- confidence: 0.9+ clear receipt, 0.7-0.89 unclear, 0.5-0.69 maybe marketing, <0.5 skip it
- If no clothing found: {"merchant": null, "items": []}
"""


# ── Main function ─────────────────────────────────────────────────────────────

def extract_purchases_from_email(
    subject: str,
    plain_text: str,
    html_text: str = "",
    prices_found: list[float] = None,
    image_urls: list[str] = None,
) -> Optional[ExtractedEmail]:
    """
    Calls Claude to extract clothing items from one email.
    Returns ExtractedEmail on success, None on any API failure.
    """
    if prices_found is None:
        prices_found = []
    if image_urls is None:
        image_urls = []

    lines = [f"Subject: {subject}"]

    body = plain_text.strip()[:3500] if plain_text.strip() else ""
    if body:
        lines.append(f"\nEmail body:\n{body}")

    if prices_found:
        lines.append("\nPre-extracted prices: " + ", ".join(f"${p:.2f}" for p in prices_found))
    else:
        lines.append("\nNo prices found — set price to null.")

    if image_urls:
        lines.append("\nProduct image URLs:\n" + "\n".join(f"  {u}" for u in image_urls[:5]))
    else:
        lines.append("\nNo images — set image_url to null.")

    prompt = "\n".join(lines)

    try:
        msg = _client.messages.create(
            model=_MODEL,
            max_tokens=1024,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = msg.content[0].text.strip()

        # Strip accidental markdown fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw).strip()

        parsed = json.loads(raw)

        if isinstance(parsed, list):
            parsed = parsed[0] if parsed else {}

        return ExtractedEmail(**parsed)

    except Exception as e:
        print(f"[Claude] API error for subject '{subject[:60]}': {e}")
        return None