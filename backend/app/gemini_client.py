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
MODEL_ID = "gemini-2.0-flash"
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


SYSTEM_PROMPT = """You are a receipt parser that extracts clothing purchase information from order confirmation emails.

Rules you must follow:

item_name:
- Maximum 60 characters
- Remove all marketing taglines, size info from the name itself, and SEO keyword spam
- BAD: "HoloChill Women's Casual Solid Color Waist Tie Bow Pullover Long Sleeve Sweater, New Arrival, Suitable For New Year Casual Wear"
- GOOD: "HoloChill Waist Tie Pullover Sweater"
- BAD: "SHEIN PETITE Solid Button Front Vest Blazer & Skirt Suit Set For Summer Business Women Clothes Sexy Office Siren Women Two Pieces Sets"
- GOOD: "SHEIN PETITE Button Front Blazer & Skirt Set"

size:
- Extract the size of each item as a short string
- Letter sizes: "XS", "S", "M", "L", "XL", "XXL", "3XL"
- Numeric sizes (pants): "28", "30", "32x30", "32x32"
- Shoe sizes: "7", "8.5", "9", "10", "11"
- Dress/jean sizes: "0", "2", "4", "6", "8", "10"
- Plus sizes: "1X", "2X", "3X"
- If an item appears multiple times with different sizes (e.g. same shirt in S and M), create one entry per size
- Set null if no size is mentioned for this specific item in the email

is_clothing:
- TRUE for: clothing, shoes, bags, jewelry, belts, hats, scarves, sunglasses, socks, underwear, swimwear, activewear
- FALSE for: hair clips, hair extensions, art supplies, electronics, home goods, food, gift cards, candles, phone cases

price:
- Use prices from the pre-extracted prices list provided
- Match each item to its most likely price
- Do NOT invent prices not in the pre-extracted list
- Set null if you cannot confidently match

image_url:
- Use URLs from the pre-extracted image list
- Assign the most relevant URL to each item
- If unsure, assign in order (first image to first item, etc.)
- Set null if no images provided

confidence:
- 0.9-1.0: clear receipt with item name and price both visible
- 0.7-0.89: order confirmation but price or details unclear
- 0.5-0.69: email mentions clothing but might be marketing not a receipt
- below 0.5: very uncertain

purchased_at:
- The ORDER date as YYYY-MM-DD, not shipping or delivery date
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
    Calls Gemini with response_schema to guarantee valid JSON matching ExtractedEmail.
    The API validates before returning — malformed/truncated JSON is impossible.

    Returns ExtractedEmail on success, None only on API failure (network/quota).
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
        "\nExtract all clothing items from this email following the rules above. "
        "Remember to extract the size for each item if mentioned."
    )

    user_prompt = "\n".join(prompt_parts)

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ExtractedEmail,  # guarantees perfect JSON
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )

        raw_dict = json.loads(response.text)
        result = ExtractedEmail(**raw_dict)
        return result

    except Exception as e:
        print(f"[Gemini] API error for subject '{subject[:60]}': {e}")
        return None