# app/gmail_client.py
#
# WHY THIS FILE: Handles all Gmail API complexity — authentication,
# fetching emails, and extracting structured content from MIME payloads.
#
# KEY CHANGES FROM V1:
# - Now extracts BOTH plain text AND HTML from emails
# - Parses HTML with BeautifulSoup to find prices and image URLs
# - Returns a richer dict so Gemini has much more to work with
#
# Add beautifulsoup4 and lxml to requirements.txt:
#   beautifulsoup4==4.12.3
#   lxml==5.3.0

import os
import re
import base64
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def get_gmail_service(refresh_token: str):
    """
    Builds an authenticated Gmail API client using a stored refresh token.

    Google's library automatically exchanges the refresh_token for a fresh
    access_token on the first API call — we never ask the user to log in again.
    """
    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )
    credentials.refresh(Request())
    return build("gmail", "v1", credentials=credentials)


def _decode_base64(data: str) -> str:
    """
    Decodes Gmail's base64url encoding to a UTF-8 string.

    Gmail uses base64url (- and _ instead of + and /) and strips padding.
    We re-add the padding before decoding.
    errors="replace" prevents crashes on malformed bytes.
    """
    padded = data + "==" * (4 - len(data) % 4)
    decoded_bytes = base64.urlsafe_b64decode(padded)
    return decoded_bytes.decode("utf-8", errors="replace")


def _extract_parts(payload: dict) -> tuple[str, str]:
    """
    Recursively walks a Gmail MIME payload and returns (plain_text, html_text).

    WHY BOTH: Plain text is clean and easy to read. HTML contains prices in
    table cells and product image URLs that plain text strips out. We need
    both to give Gemini the best chance of finding price and image data.

    Gmail MIME structure example:
        multipart/mixed
        └── multipart/alternative
            ├── text/plain   ← we want this
            └── text/html    ← and this

    We recursively descend until we find the leaf parts.
    """
    plain = ""
    html = ""
    mime_type = payload.get("mimeType", "")

    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            plain = _decode_base64(data)

    elif mime_type == "text/html":
        data = payload.get("body", {}).get("data", "")
        if data:
            html = _decode_base64(data)

    # Recurse into sub-parts for multipart/* types
    for part in payload.get("parts", []):
        sub_plain, sub_html = _extract_parts(part)
        if sub_plain and not plain:
            plain = sub_plain
        if sub_html and not html:
            html = sub_html

    return plain, html


def _extract_prices_from_html(html: str) -> list[float]:
    """
    Finds all dollar amounts in an HTML email body.

    WHY: SHEIN, Quince, and most retail emails put prices in HTML table
    cells that don't appear in the plain text version. We scrape them here
    and pass them to Gemini as context so it can match items to prices.

    Returns a list of floats, e.g. [12.99, 24.99, 5.00]
    Deduplicates and sorts ascending.
    """
    # Strip HTML tags to get plain text for regex matching
    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(separator=" ")

    # Match patterns like: $12.99  $1,234.56  USD 45.00  45.00 USD
    price_pattern = re.compile(
        r"""
        (?:
            \$\s*[\d,]+\.?\d*       # $12.99 or $1,234.56
            |
            USD\s*[\d,]+\.?\d*      # USD 12.99
            |
            [\d,]+\.?\d*\s*USD      # 12.99 USD
        )
        """,
        re.VERBOSE,
    )

    prices = []
    for match in price_pattern.finditer(text):
        raw = match.group()
        # Strip currency symbols and whitespace, keep digits and decimal
        numeric = re.sub(r"[^\d.]", "", raw.replace(",", ""))
        try:
            val = float(numeric)
            # Filter out nonsense values: prices between $0.50 and $2000
            if 0.5 <= val <= 2000:
                prices.append(val)
        except ValueError:
            pass

    # Deduplicate and sort
    return sorted(set(prices))


def _extract_images_from_html(html: str) -> list[str]:
    """
    Finds product image URLs in an HTML email body.

    WHY: Retail emails embed product thumbnails as <img> tags in the HTML.
    Gemini can't see images directly, but we can pass the URLs so the
    frontend can display the correct product image on the review card.

    We filter aggressively because emails contain many non-product images:
    - Logos, spacers, tracking pixels (usually tiny, under 10px)
    - Social media icons
    - Unsubscribe footer images

    We keep only https:// URLs that look like product images based on
    common CDN patterns from major retailers.
    """
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    images = []

    for img in soup.find_all("img"):
        src = img.get("src", "")

        # Must be an https URL
        if not src.startswith("https://"):
            continue

        # Skip tracking pixels and tiny images
        # Many emails use 1x1 transparent GIFs for open tracking
        width = img.get("width", "")
        height = img.get("height", "")
        try:
            if width and int(width) < 50:
                continue
            if height and int(height) < 50:
                continue
        except (ValueError, TypeError):
            pass

        # Skip common non-product image patterns
        skip_patterns = [
            "logo", "icon", "pixel", "track", "spacer",
            "badge", "social", "facebook", "instagram", "twitter",
            "unsubscribe", "footer", "header-img",
        ]
        src_lower = src.lower()
        if any(p in src_lower for p in skip_patterns):
            continue

        images.append(src)

        # Cap at 5 images per email — we only need the first few product images
        if len(images) >= 5:
            break

    return images


def _html_to_clean_text(html: str) -> str:
    """
    Converts HTML to clean readable text for Gemini.

    WHY: Even though we extract prices and images separately, we also want
    Gemini to read a clean text version of the HTML (not raw tags). BeautifulSoup
    strips all tags and gives us the readable content, which includes item names,
    descriptions, and any prices that weren't caught by the regex.

    Capped at 5000 chars. HTML emails can be huge; Gemini doesn't need all of it.
    """
    if not html:
        return ""
    soup = BeautifulSoup(html, "lxml")
    # separator=" " puts spaces between elements so words don't get concatenated
    text = soup.get_text(separator=" ")
    # Collapse multiple whitespace/newlines into single spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text[:5000]


def fetch_emails(service, after_date_str: str, max_results: int = 50) -> list[dict]:
    """
    Fetches purchase-related emails after a given date.

    Args:
        service:         Authenticated Gmail service from get_gmail_service()
        after_date_str:  "YYYY/MM/DD" format, e.g. "2024/10/01"
        max_results:     Max messages to fetch (50 for MVP)

    Returns a list of dicts, each with:
        message_id      Gmail's unique message ID (used for deduplication)
        thread_id       Gmail thread ID
        subject         Subject line
        snippet         Gmail's 200-char auto-preview
        plain_text      Extracted plain text body (up to 4000 chars)
        html_text       Cleaned text extracted from HTML (up to 5000 chars)
        prices_found    List of dollar amounts found in the email, e.g. [29.99, 45.00]
        image_urls      List of product image URLs found in the email HTML
        date_str        Date header from the email
    """
    # Gmail search query — same syntax as the Gmail search box
    query = (
        f"after:{after_date_str} "
        "(order OR receipt OR shipped OR confirmation OR invoice OR purchase OR delivery)"
    )

    result = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=max_results,
    ).execute()

    message_refs = result.get("messages", [])
    if not message_refs:
        return []

    emails = []
    for ref in message_refs:
        msg_id = ref["id"]

        # format="full" returns the complete MIME tree including all nested parts
        msg = service.users().messages().get(
            userId="me",
            id=msg_id,
            format="full",
        ).execute()

        headers = {
            h["name"]: h["value"]
            for h in msg.get("payload", {}).get("headers", [])
        }

        subject = headers.get("Subject", "")
        date_str = headers.get("Date", "")

        # Extract both plain text and HTML from the MIME tree
        plain_text, html_raw = _extract_parts(msg.get("payload", {}))

        # Clean up the plain text
        plain_text = plain_text[:4000] if plain_text else msg.get("snippet", "")

        # Convert raw HTML to readable text for Gemini
        html_text = _html_to_clean_text(html_raw) if html_raw else ""

        # Extract structured data from the HTML
        prices_found = _extract_prices_from_html(html_raw) if html_raw else []
        image_urls = _extract_images_from_html(html_raw) if html_raw else []

        emails.append({
            "message_id": msg_id,
            "thread_id": msg.get("threadId", ""),
            "subject": subject,
            "snippet": msg.get("snippet", ""),
            "plain_text": plain_text,
            "html_text": html_text,
            "prices_found": prices_found,
            "image_urls": image_urls,
            "date_str": date_str,
        })

    return emails