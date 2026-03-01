import os
import json
import re
import requests
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = "gemini-3.1-pro-preview"
CONFIDENCE_THRESHOLD = 0.65


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


SYSTEM_PROMPT = """You are a receipt parser. Extract clothing purchases from order confirmation emails.

Return ONLY a JSON object (no markdown, no backticks) with this exact structure:
{"merchant": "string or null", "items": [{"item_name": "string", "price": number_or_null, "purchased_at": "YYYY-MM-DD or null", "image_url": "string or null", "category_guess": "Tops|Bottoms|Outerwear|Shoes|Accessories|Other or null", "size": "string or null", "confidence": 0.0, "is_clothing": true}]}

Rules:
- item_name: max 60 chars, remove marketing spam
- is_clothing: true for clothing/shoes/bags/jewelry, false for electronics/food/gift cards
- price: only use prices from the pre-extracted list, null if unsure
- confidence: 0.9+ for clear receipt, 0.7-0.89 for unclear, 0.5-0.69 for maybe marketing
- purchased_at: order date only as YYYY-MM-DD
- If no clothing found return: {"merchant": null, "items": []}"""


def extract_purchases_from_email(
    subject: str,
    plain_text: str,
    html_text: str = "",
    prices_found: list[float] = None,
    image_urls: list[str] = None,
) -> Optional[ExtractedEmail]:

    if prices_found is None:
        prices_found = []
    if image_urls is None:
        image_urls = []

    parts = [f"Subject: {subject}\n"]
    if plain_text:
        parts.append(f"Email text:\n{plain_text[:6000]}\n")
    if prices_found:
        parts.append(f"Prices found in email: {', '.join(f'${p:.2f}' for p in prices_found)}\n")
    else:
        parts.append("No prices found. Set price to null.\n")
    if image_urls:
        parts.append(f"Image URLs: {', '.join(image_urls[:5])}\n")
    else:
        parts.append("No images. Set image_url to null.\n")
    parts.append("Extract clothing items. Return ONLY the JSON object.")

    payload = {
        "contents": [{"role": "user", "parts": [{"text": "\n".join(parts)}]}],
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096},
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_ID}:generateContent?key={GEMINI_API_KEY}"

    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw).strip()
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            parsed = parsed[0] if parsed else {}
        return ExtractedEmail(**parsed)
    except Exception as e:
        print(f"[Gemini] API error for subject '{subject[:60]}': {e}")
        return None