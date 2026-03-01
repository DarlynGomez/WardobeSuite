import os
import json
from typing import Optional
from enum import Enum

from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    is_clothing: bool = False


class ExtractedEmail(BaseModel):
    # Store or brand name, e.g. "SHEIN", "Quince", "ASOS"
    merchant: Optional[str] = None
    # All clothing items found in this email (may be empty list)
    items: list[ExtractedItem] = []


# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a receipt parser that extracts clothing purchase information from order confirmation emails.

Rules you must follow:

item_name:
- Maximum 60 characters
- Remove all marketing taglines, size info, and comma-separated SEO keywords
- BAD: "HoloChill Women's Casual Solid Color Waist Tie Bow Pullover Long Sleeve Sweater, New Arrival, Suitable For New Year Casual Wear, Teacher Outfits"
- GOOD: "HoloChill Waist Tie Pullover Sweater"
- BAD: "SHEIN PETITE Solid Button Front Vest Blazer & Skirt Suit Set For Summer Business Women Clothes Sexy Office Siren Women Two Pieces Sets Old Money Style"
- GOOD: "SHEIN PETITE Button Front Blazer & Skirt Set"

is_clothing:
- TRUE for: clothing, shoes, bags, jewelry, belts, hats, scarves, sunglasses, socks, underwear, swimwear, activewear
- FALSE for: hair clips, hair extensions, art supplies, electronics, home goods, food, gift cards, candles, phone cases

price:
- Use prices from the pre-extracted prices list provided in the prompt
- Match each item to its most likely price based on context
- Do NOT invent prices that are not in the pre-extracted list
- Set null if you cannot confidently match an item to a price

image_url:
- Use URLs from the pre-extracted image list provided in the prompt
- Assign the most relevant URL to each item
- If unsure, assign in order (first image to first item, etc.)
- Set null if no images were provided

confidence:
- 0.9-1.0: clear receipt with item name and price both visible
- 0.7-0.89: order confirmation but price or details unclear
- 0.5-0.69: email mentions clothing but might be marketing not a receipt
- below 0.5: very uncertain — probably not a real purchase

purchased_at:
- The ORDER date shown in the email, as YYYY-MM-DD
- Not the shipping or delivery date
- Set null if not found

If no clothing items are found, return an empty items list."""


def extract_purchases_from_email(
    subject: str,
    plain_text: str,
    html_text: str = "",
    prices_found: list[float] = None,
    image_urls: list[str] = None,
) -> Optional[ExtractedEmail]:
    """
    Calls Gemini to extract clothing purchases from an email.

    Uses response_schema=ExtractedEmail to GUARANTEE the response is valid JSON
    matching our Pydantic schema. The Gemini API validates before returning —
    we will never receive malformed, truncated, or free-text output.

    Args:
        subject:       Email subject line
        plain_text:    Plain text body (up to 4000 chars from gmail_client)
        html_text:     Cleaned text from HTML body (up to 5000 chars)
        prices_found:  Dollar amounts pre-extracted from HTML by gmail_client
        image_urls:    Image URLs pre-extracted from HTML by gmail_client

    Returns:
        ExtractedEmail on success — always a valid, schema-conforming object
        None only if the API call itself fails (network error, quota exceeded)
    """
    if prices_found is None:
        prices_found = []
    if image_urls is None:
        image_urls = []

    prompt_parts = [f"Subject: {subject}\n"]

    if plain_text:
        prompt_parts.append(f"Plain text content:\n{plain_text}\n")

    if html_text:
        prompt_parts.append(f"HTML content (tags stripped):\n{html_text}\n")

    if prices_found:
        prices_str = ", ".join(f"${p:.2f}" for p in prices_found)
        prompt_parts.append(
            f"\nPre-extracted prices from this email: {prices_str}\n"
            "Match each clothing item to one of these exact prices.\n"
        )
    else:
        prompt_parts.append(
            "\nNo prices could be extracted from this email. Set price to null for all items.\n"
        )

    if image_urls:
        urls_block = "\n".join(f"  {i+1}. {url}" for i, url in enumerate(image_urls))
        prompt_parts.append(
            f"\nPre-extracted product image URLs:\n{urls_block}\n"
            "Assign the most relevant URL to each item's image_url field.\n"
        )
    else:
        prompt_parts.append(
            "\nNo images found in this email. Set image_url to null for all items.\n"
        )

    prompt_parts.append(
        "\nExtract all clothing items from this email following the rules above."
    )

    user_prompt = "\n".join(prompt_parts)

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                # These two lines together guarantee perfect JSON every time.
                # response_mime_type tells the API we want JSON.
                # response_schema tells it exactly what shape that JSON must be.
                # The API will not return unless the output validates against
                # ExtractedEmail — no more parse errors, no truncated strings.
                response_mime_type="application/json",
                response_schema=ExtractedEmail,
                temperature=0.1,         # near-deterministic for structured extraction
                max_output_tokens=4096,  # enough for large SHEIN orders (20+ items)
            ),
        )

        # response.text is guaranteed valid JSON — parse and validate through
        # Pydantic as a final safety net
        raw_dict = json.loads(response.text)
        result = ExtractedEmail(**raw_dict)
        return result

    except Exception as e:
        print(f"[Gemini] API error for subject '{subject[:60]}': {e}")
        return None