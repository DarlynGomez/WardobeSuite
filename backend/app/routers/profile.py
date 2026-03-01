# app/routers/profile.py
#
# Consumer profile endpoints — additive, no existing routes touched.
#
#   POST /profile/color-analysis   → Upload 2 photos → Gemini returns color season
#   POST /profile/stylist          → AI stylist chatbot (Claude), wardrobe context injected
#   POST /profile/wardrobe/upload  → Manually add a clothing item to the wardrobe
#
# All endpoints require X-User-Id header (same pattern as review.py).

import base64
import json
import os
from typing import Optional, List
from datetime import datetime

import anthropic
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Gemini for image analysis (color season reads photo tones — vision model needed)
from google import genai
from google.genai import types

from app.database import get_db, generate_uuid
from app.models import User, Item

load_dotenv()

router = APIRouter()

# ── Clients ───────────────────────────────────────────────────────────────────

_gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
_GEMINI_VISION_MODEL = "gemini-3-flash-preview"   # supports image input

_anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_STYLIST_MODEL = "claude-sonnet-4-20250514"


# ── Auth dependency (identical to review.py) ─────────────────────────────────

def get_current_user(
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {x_user_id} not found.")
    return user


# ── POST /profile/color-analysis ─────────────────────────────────────────────

COLOR_ANALYSIS_PROMPT = """You are a professional personal color analyst trained in the 12-season and 4-season color theory systems.

You will receive two photos:
1. A full-body photo of the person
2. A close-up face photo of the person

Analyze BOTH images together to determine the person's color season profile.

Examine:
- Skin undertone (warm/cool/neutral, depth: fair/light/medium/tan/deep)
- Natural hair color (ignore dye — look at roots if visible, or dominant shade)
- Eye color and whether they are warm or cool-toned
- The contrast level between hair, skin, and eyes (low/medium/high)
- Any visible veins on the wrist or inner arm if visible (blue/purple = cool, green = warm)

Classify the person into ONE of the 12 color seasons:
  Warm springs: True Spring, Light Spring, Bright Spring
  Cool summers: True Summer, Light Summer, Soft Summer
  Warm autumns: True Autumn, Soft Autumn, Dark Autumn
  Cool winters: True Winter, Dark Winter, Bright Winter

Return a JSON object with EXACTLY these fields (no markdown, no preamble):
{
  "season": "<one of the 12 seasons above>",
  "season_family": "<Spring | Summer | Autumn | Winter>",
  "undertone": "<warm | cool | neutral>",
  "skin_depth": "<fair | light | medium | tan | deep>",
  "contrast_level": "<low | medium | high>",
  "dominant_colors": ["<color1>", "<color2>", "<color3>", "<color4>", "<color5>"],
  "avoid_colors": ["<color1>", "<color2>", "<color3>"],
  "palette_description": "<2-3 sentences describing the palette that flatters this season>",
  "celebrity_examples": ["<name1>", "<name2>"],
  "styling_tips": ["<tip1>", "<tip2>", "<tip3>"],
  "confidence": <0.0 to 1.0>
}

dominant_colors: list 5 specific colors (e.g. "dusty rose", "warm camel", "sage green") that look best on this season.
avoid_colors: 3 colors that clash with this season.
confidence: how certain you are based on photo quality and clarity (0.9+ = very clear, 0.6-0.89 = reasonable, below 0.6 = photos unclear).

Return ONLY the JSON. No text before or after."""


@router.post("/color-analysis")
async def color_analysis(
    full_body_photo: UploadFile = File(..., description="Clear full-body photo of the user"),
    face_photo: UploadFile = File(..., description="Clear close-up face photo of the user"),
    user: User = Depends(get_current_user),
):
    """
    Analyzes two user photos with Gemini vision to determine color season.

    WHY GEMINI: Gemini 2.0 Flash is already integrated for email parsing and
    supports multimodal image input. Using it here keeps dependencies consistent
    and avoids adding another vision API. Claude is reserved for text tasks.

    The endpoint reads both uploaded files into memory, converts them to base64,
    sends them to Gemini with a structured prompt, and parses the JSON response.

    Returns a color season profile the frontend renders as a visual palette card.
    """
    # Read both uploaded files
    full_body_bytes = await full_body_photo.read()
    face_bytes = await face_photo.read()

    # Validate file sizes (max 10 MB each)
    if len(full_body_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Full body photo too large (max 10 MB).")
    if len(face_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Face photo too large (max 10 MB).")

    # Determine MIME types
    def _mime(ct: str | None) -> str:
        if ct and ct.startswith("image/"):
            return ct
        return "image/jpeg"

    full_mime = _mime(full_body_photo.content_type)
    face_mime = _mime(face_photo.content_type)

    try:
        response = _gemini.models.generate_content(
            model=_GEMINI_VISION_MODEL,
            contents=[
                types.Part.from_bytes(data=full_body_bytes, mime_type=full_mime),
                types.Part.from_bytes(data=face_bytes, mime_type=face_mime),
                COLOR_ANALYSIS_PROMPT,
            ],
        )

        raw = response.text.strip()
        # Strip markdown fences if Gemini wrapped the JSON
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)

        # Validate required keys are present
        required = ["season", "season_family", "undertone", "dominant_colors",
                    "avoid_colors", "palette_description", "styling_tips", "confidence"]
        missing = [k for k in required if k not in result]
        if missing:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini response missing fields: {missing}. Try clearer photos."
            )

        return result

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail="Could not parse Gemini color analysis response. Please try again with clearer photos."
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Color analysis failed: {str(e)[:200]}")


# ── POST /profile/stylist ─────────────────────────────────────────────────────

class StylistMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class StylistRequest(BaseModel):
    messages: List[StylistMessage]   # full conversation history
    color_season: Optional[str] = None   # e.g. "True Autumn" — injected into system prompt


@router.post("/stylist")
def ai_stylist(
    body: StylistRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI stylist chatbot powered by Claude.

    WHY CLAUDE HERE: The stylist requires nuanced, conversational fashion advice
    with wardrobe context injected as structured data. Claude excels at this
    kind of context-aware reasoning over user-specific data.

    The wardrobe is fetched fresh from the DB on every call so the stylist
    always sees the user's current items. The color season (if set by the
    user) is injected into the system prompt so recommendations are palatte-aware.

    Conversation history is sent in full each call — Claude has no memory between
    requests, so the frontend must maintain and send the full message list.
    """
    # Load the user's current wardrobe from DB
    items = db.query(Item).filter(Item.user_id == user.id).all()

    wardrobe_summary = []
    for it in items:
        wardrobe_summary.append({
            "name": it.item_name,
            "category": it.category or "Unknown",
            "price": f"${(it.price_cents or 0) / 100:.2f}",
            "merchant": it.merchant or "Unknown",
            "wear_count": it.wear_count or 0,
        })

    # Category breakdown for stats
    cat_counts: dict = {}
    for it in items:
        cat = it.category or "Other"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    total_value = sum((it.price_cents or 0) for it in items) / 100

    system_prompt = f"""You are a warm, knowledgeable personal stylist AI for WardrobeSuite. You help users make the most of their wardrobe, plan outfits, discover their style, and shop smarter.

USER'S WARDROBE ({len(items)} items, total value ${total_value:.2f}):
{json.dumps(wardrobe_summary, indent=2)}

WARDROBE BREAKDOWN BY CATEGORY:
{json.dumps(cat_counts, indent=2)}

{f"USER'S COLOR SEASON: {body.color_season}" if body.color_season else "Color season: not yet analyzed"}

Your role:
- Suggest outfit combinations from the user's ACTUAL wardrobe items above (use real item names)
- Give honest gap analysis: what's missing from their wardrobe?
- Recommend what to buy next based on what they already own
- If color season is set, factor it into color recommendations
- Give style advice that is inclusive, gender-affirming, and celebrates all body types
- Be conversational, specific, and encouraging
- When suggesting outfits, name the actual items from their wardrobe

Keep responses concise (under 200 words) unless the user asks for detail. Use bullet points for outfit suggestions. Be warm and personal."""

    # Convert message history to Anthropic format
    anthropic_messages = []
    for msg in body.messages:
        if msg.role in ("user", "assistant"):
            anthropic_messages.append({
                "role": msg.role,
                "content": msg.content,
            })

    if not anthropic_messages:
        raise HTTPException(status_code=400, detail="At least one message is required.")

    # Ensure the last message is from the user
    if anthropic_messages[-1]["role"] != "user":
        raise HTTPException(status_code=400, detail="Last message must be from the user.")

    try:
        response = _anthropic.messages.create(
            model=_STYLIST_MODEL,
            max_tokens=600,
            system=system_prompt,
            messages=anthropic_messages,
        )
        reply = response.content[0].text
        return {"reply": reply, "model": _STYLIST_MODEL}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stylist AI error: {str(e)[:200]}")


# ── POST /profile/wardrobe/upload ─────────────────────────────────────────────

@router.post("/wardrobe/upload")
async def upload_wardrobe_item(
    item_name: str = Form(...),
    category: str = Form(...),
    price_dollars: float = Form(...),
    merchant: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None, description="Optional item photo"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually adds a clothing item to the user's approved wardrobe.

    This bypasses the Gmail scan → review queue flow, letting users add
    items they bought in-store, received as gifts, or owned before signing up.

    If a photo is provided it is base64-encoded and stored as a data URI
    in image_url (same field used by Gmail-scanned items). This keeps the
    wardrobe grid display logic identical for both paths.

    Limits: item_name max 120 chars, price max $9999, photo max 5 MB.
    """
    # Validate inputs
    item_name = item_name.strip()[:120]
    if not item_name:
        raise HTTPException(status_code=422, detail="item_name cannot be empty.")

    valid_categories = [
        "Tops", "Bottoms", "Dresses", "Outerwear",
        "Footwear", "Swimwear", "Undergarments", "Accessories", "Other"
    ]
    if category not in valid_categories:
        raise HTTPException(
            status_code=422,
            detail=f"category must be one of: {valid_categories}"
        )

    if price_dollars < 0 or price_dollars > 9999:
        raise HTTPException(status_code=422, detail="price_dollars must be between 0 and 9999.")

    price_cents = round(price_dollars * 100)

    # Handle optional photo upload
    image_url: Optional[str] = None
    if photo and photo.filename:
        photo_bytes = await photo.read()
        if len(photo_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Photo too large (max 5 MB).")
        mime = photo.content_type or "image/jpeg"
        b64 = base64.b64encode(photo_bytes).decode("utf-8")
        image_url = f"data:{mime};base64,{b64}"

    # Insert directly into Items table (same as approve endpoint in review.py)
    new_item = Item(
        user_id=user.id,
        merchant=merchant.strip() if merchant else "Manual upload",
        item_name=item_name,
        category=category,
        price_cents=price_cents,
        currency="USD",
        purchased_at=datetime.utcnow(),
        wear_count=0,
        source="manual",
        image_url=image_url,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "success": True,
        "wardrobe_item_id": new_item.id,
        "item_name": new_item.item_name,
        "category": new_item.category,
        "price_cents": new_item.price_cents,
        "image_url": new_item.image_url,
        "message": f"'{item_name}' added to your wardrobe.",
    }