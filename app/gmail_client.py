# app/gmail_client.py
#
# WHY THIS FILE: The Gmail API requires authentication and has a specific
# structure for messages (base64-encoded, multipart MIME). This file handles
# all of that complexity and gives the scan routes a simple interface:
#
#   service = get_gmail_service(user.refresh_token)
#   emails = fetch_emails(service, "2024/10/01", max_results=50)
#
# Each email in the returned list has: message_id, thread_id, subject,
# snippet, body (plain text), and date_str.

import os
import base64
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def get_gmail_service(refresh_token: str):
    """
    Builds an authenticated Gmail API client using a stored refresh token.

    WHY: The access token (short-lived, 1hr) expires. But we have the
    refresh_token (long-lived). We create a Credentials object with just
    the refresh_token, and Google's library automatically exchanges it for
    a fresh access_token when we make our first API call. We never need
    to bother the user for login again.

    Args:
        refresh_token: The string stored in users.refresh_token in the DB

    Returns:
        A Gmail API service object ready to make API calls
    """
    credentials = Credentials(
        token=None,             # No access token yet — we'll get one from refresh
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )

    # This line triggers the token refresh. It makes a POST request to Google's
    # token endpoint and fills in credentials.token with a fresh access_token.
    credentials.refresh(Request())

    # Build returns a "Resource" object for the Gmail API version 1.
    # All subsequent API calls go through this object.
    return build("gmail", "v1", credentials=credentials)


def _decode_base64(data: str) -> str:
    """
    Decodes a Gmail base64url-encoded string to plain text.

    WHY base64url: Gmail encodes message content in base64url (a URL-safe
    variant of base64 that uses - and _ instead of + and /). Python's
    base64 library can decode it, but we must pad it first — Google omits
    the = padding characters that base64 normally requires.

    errors="replace" means any bytes that can't be decoded as UTF-8 are
    replaced with the Unicode replacement character (?) instead of crashing.
    """
    # Add padding: base64 strings must have length divisible by 4
    padded = data + "==" * (4 - len(data) % 4)
    decoded_bytes = base64.urlsafe_b64decode(padded)
    return decoded_bytes.decode("utf-8", errors="replace")


def _extract_body_from_payload(payload: dict) -> str:
    """
    Recursively extracts plain text from a Gmail message payload.

    WHY RECURSIVE: Gmail messages can be multipart — they contain multiple
    "parts" nested inside each other (e.g., text/plain + text/html inside
    a multipart/alternative, which is itself inside a multipart/mixed).
    We recursively search all parts until we find text/plain content.

    WHY PLAIN TEXT NOT HTML: We send email content to Gemini for extraction.
    HTML includes a lot of noise (CSS, navigation menus, unsubscribe links).
    Plain text is cleaner and uses fewer tokens, making Gemini more reliable.

    Returns the first text/plain content found, capped at 4000 characters.
    4000 chars is enough to capture any receipt without wasting Gemini tokens.
    """
    mime_type = payload.get("mimeType", "")

    # Base case: this payload part is plain text
    if mime_type == "text/plain":
        body_data = payload.get("body", {}).get("data", "")
        if body_data:
            return _decode_base64(body_data)[:4000]

    # Recursive case: this payload has sub-parts
    for part in payload.get("parts", []):
        result = _extract_body_from_payload(part)
        if result:
            return result

    # Fallback: no text/plain found in any part
    return ""


def fetch_emails(service, after_date_str: str, max_results: int = 50) -> list[dict]:
    """
    Fetches emails that match purchase-related keywords after a given date.

    Args:
        service: Authenticated Gmail API service from get_gmail_service()
        after_date_str: Date string in format "YYYY/MM/DD", e.g. "2024/10/01"
        max_results: Maximum number of messages to fetch (default 50 for MVP)

    Returns:
        List of dicts, each with:
            message_id  - Gmail's unique ID for this message
            thread_id   - Gmail's thread (conversation) ID
            subject     - Email subject line
            snippet     - Gmail's auto-generated short preview text
            body        - Extracted plain text of the email body (capped at 4000 chars)
            date_str    - Date header from the email

    WHY KEYWORD FILTER: We only want purchase-related emails. Using Gmail's
    search query (q) to filter by keywords before we fetch means we don't
    waste time or Gemini API calls on newsletters, personal emails, etc.
    The keywords are OR'd together — any match is enough.

    WHY MAX 50: The initial scan could match hundreds of emails. Fetching
    each one is a separate API call. 50 is a reasonable limit that keeps the
    scan fast (under 30 seconds) for a hackathon demo.
    """
    # Gmail search query — same syntax as the Gmail search box
    # "after:YYYY/MM/DD" filters to emails after that date
    # The keyword list matches common receipt/order email vocabulary
    query = (
        f"after:{after_date_str} "
        "(order OR receipt OR shipped OR confirmation OR invoice OR purchase OR delivery)"
    )

    # List matching message IDs.
    # messages.list returns only IDs and thread IDs — not message content.
    # We need a second API call (messages.get) to fetch each message's content.
    result = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=max_results,
    ).execute()

    # If no matching messages, return empty list immediately
    message_refs = result.get("messages", [])
    if not message_refs:
        return []

    emails = []
    for ref in message_refs:
        msg_id = ref["id"]

        # Fetch the full message content.
        # format="full" returns the complete MIME structure including all parts.
        # This is a separate API call per message — this is why we cap at 50.
        msg = service.users().messages().get(
            userId="me",
            id=msg_id,
            format="full",
        ).execute()

        # Gmail headers are a flat list of {"name": "Subject", "value": "..."} dicts.
        # We convert to a dict for easy lookup.
        headers = {
            h["name"]: h["value"]
            for h in msg.get("payload", {}).get("headers", [])
        }

        subject = headers.get("Subject", "")
        date_str = headers.get("Date", "")

        # Extract plain text body from the MIME structure
        body = _extract_body_from_payload(msg.get("payload", {}))

        # If we couldn't extract a body, fall back to Gmail's snippet.
        # The snippet is Gmail's auto-generated 200-character preview — not ideal,
        # but better than sending Gemini nothing.
        if not body:
            body = msg.get("snippet", "")

        emails.append({
            "message_id": msg_id,
            "thread_id": msg.get("threadId", ""),
            "subject": subject,
            "snippet": msg.get("snippet", ""),
            "body": body,
            "date_str": date_str,
        })

    return emails