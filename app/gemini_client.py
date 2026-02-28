# app/gemini_client.py
#
# WHY THIS FILE: Encapsulates all Gemini AI logic. Given an email subject
# and body, it returns a structured Python object listing every clothing
# item found in that email.
#
# The key challenges this file solves:
#   1. Gemini can return free-form text — we must force JSON output
#   2. Gemini can return malformed JSON — we must validate it
#   3. Gemini can hallucinate — we use confidence scores to filter noise
#   4. Not every email is a clothing purchase — we use is_clothing to filter

import os
import json
import re
from typing import Optional

import google.generativeai as genai
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv

load_dotenv()

# Configure the Gemini SDK with your API key.
# This must happen once before any GenerativeModel calls.
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# CONFIDENCE_THRESHOLD: Only insert items into the review queue if Gemini
# gives them a confidence score at or above this value.
# 0.65 means "Gemini must be at least 65% sure this is a real clothing item."
# Lower = more items in the queue (more noise, fewer misses)
# Higher = fewer items (less noise, more misses)
# 0.65 is a reasonable hackathon default — adjust after testing with your emails.
CONFIDENCE_THRESHOLD = 0.65


# ── Pydantic schemas ──────────────────────────────────────────────────────────
# WHY PYDANTIC: Gemini returns a string. Even when we ask for JSON, it might
# return extra text, wrong field names, or missing fields. Pydantic validates
# the parsed JSON and raises a clear error if it doesn't match our schema.

class ExtractedItem(BaseModel):
    """Represents one clothing item that Gemini found in an email."""

    item_name: str
    # Price as a decimal dollar amount (e.g. 49.99), NOT cents
    # Optional because Gemini might not find it in every email
    price: Optional[float] = None
    # ISO date string "YYYY-MM-DD" or None if not found
    purchased_at: Optional[str] = None
    # URL to a product image found in the email HTML, or None
    image_url: Optional[str] = None
    # Gemini's guess at the category ("Shoes", "Tops", etc.) or None
    category_guess: Optional[str] = None
    # How confident Gemini is that this is a real clothing purchase.
    # ge=0.0, le=1.0 means Pydantic will reject values outside [0.0, 1.0]
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    # True if this is a wearable item (clothing, shoes, bags, accessories)
    # False for electronics, home goods, food, etc.
    is_clothing: bool = False


class ExtractedEmail(BaseModel):
    """Top-level structure for Gemini's response about one email."""

    # The store or brand name, e.g. "ASOS", "Zara", "Amazon"
    merchant: Optional[str] = None
    # List of items found in this email (may be empty)
    items: list[ExtractedItem] = []


# ── System prompt ─────────────────────────────────────────────────────────────
# WHY A SYSTEM PROMPT: Gemini's behavior changes dramatically based on how
# you frame the task. A system prompt sets the "character" and rules once,
# so the user prompt (the actual email) can be shorter and more focused.
#
# The most important instruction is "Return ONLY valid JSON" — any additional
# text (like "Sure! Here's the JSON:") breaks our json.loads() call.
SYSTEM_PROMPT = """You are a receipt parser specialized in clothing purchases.

Given an email subject and body, extract information about clothing items purchased.

Return ONLY valid JSON. No markdown. No code fences. No explanations. No extra text before or after the JSON.

The JSON must match this exact schema:
{
  "merchant": "store name or null",
  "items": [
    {
      "item_name": "name of the item",
      "price": 49.99,
      "purchased_at": "YYYY-MM-DD or null",
      "image_url": "URL string or null",
      "category_guess": "one of: Tops, Bottoms, Outerwear, Shoes, Accessories, or null",
      "confidence": 0.85,
      "is_clothing": true
    }
  ]
}

Rules you must follow:
- is_clothing must be true only for wearable items: clothes, shoes, bags, jewelry, sunglasses, belts, hats, scarves. Set to false for electronics, software, home goods, food, gift cards, and anything not worn on the body.
- confidence is your certainty from 0.0 to 1.0 that this is a real clothing purchase appearing in this email. Be conservative — if the email is ambiguous, set confidence low.
- price is a decimal dollar amount (e.g. 49.99), not cents. Set to null if not found.
- If the email contains no clothing purchases, return: {"merchant": null, "items": []}
- Do not invent items that are not mentioned in the email.
"""


def extract_purchases_from_email(
    subject: str,
    body: str,
) -> Optional[ExtractedEmail]:
    """
    Calls Gemini to extract clothing purchase data from an email.

    Args:
        subject: The email subject line
        body: Plain text content of the email (capped to ~4000 chars upstream)

    Returns:
        ExtractedEmail object if successful, None if Gemini fails or returns
        unparseable output. The caller handles None by skipping the email.

    WHY gemini-1.5-flash: Flash is faster and cheaper than Pro. For extraction
    tasks with a strict schema, it performs as well as Pro. Speed matters here
    because we call this once per email (up to 50 calls per scan).

    WHY temperature=0.1: Lower temperature = more deterministic output.
    We want consistent JSON, not creative text. 0.1 still allows some
    flexibility for parsing ambiguous emails.
    """
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    # The user prompt contains only the email content.
    # The extraction rules are in the system prompt above.
    user_prompt = f"""Subject: {subject}

Email body:
{body}

Extract clothing purchases from this email and return JSON."""

    try:
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,       # near-deterministic for structured output
                max_output_tokens=1024,  # receipts don't need long responses
            ),
        )

        raw_text = response.text.strip()

        # Strip markdown code fences if Gemini adds them despite our instructions.
        # This is a defensive measure — we've seen ```json ... ``` appear even
        # when the prompt says not to include them.
        raw_text = re.sub(r"^```json\s*", "", raw_text)
        raw_text = re.sub(r"^```\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)
        raw_text = raw_text.strip()

        # Parse the JSON string into a Python dict
        parsed_dict = json.loads(raw_text)

        # Validate the dict against our Pydantic schema.
        # If any required field is wrong type or missing, ValidationError is raised.
        extracted = ExtractedEmail(**parsed_dict)

        return extracted

    except json.JSONDecodeError as e:
        # Gemini returned something that's not valid JSON.
        # Log it for debugging and return None so the caller can skip this email.
        print(f"[Gemini] JSON parse error for subject '{subject[:50]}': {e}")
        print(f"[Gemini] Raw response was: {raw_text[:200]}")
        return None

    except ValidationError as e:
        # Gemini returned valid JSON but it doesn't match our schema.
        print(f"[Gemini] Schema validation error for subject '{subject[:50]}': {e}")
        return None

    except Exception as e:
        # Catch-all for API errors (rate limits, network issues, etc.)
        print(f"[Gemini] Unexpected error for subject '{subject[:50]}': {e}")
        return None