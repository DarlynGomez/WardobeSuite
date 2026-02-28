# app/routers/auth.py
#
# WHY THIS FILE: Implements the Gmail OAuth 2.0 flow in two steps:
#
# Step 1 — GET /auth/google/start
#   The frontend calls this to get a URL. The user visits that URL in their
#   browser, logs into Google, and grants permission to read their Gmail.
#   Google then redirects the browser to our callback URL.
#
# Step 2 — GET /auth/google/callback
#   Google redirects here after the user approves. The URL contains a
#   short-lived "code". We exchange the code for a long-lived refresh_token.
#   We store the refresh_token in the database so we can scan Gmail later
#   without asking the user to log in again.

import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from dotenv import load_dotenv

from app.database import get_db
from app.models import User, ScanSettings

# Load .env file values into environment variables.
# This must be called before os.getenv() will find the values.
load_dotenv()

router = APIRouter()

# Gmail read-only scope. This is the minimum permission needed to list and
# read emails. We are NOT requesting write permission — we never modify emails.
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# Build the "client_config" dict that google-auth-oauthlib expects.
# We read from environment variables rather than hardcoding so that:
#   1. Secrets don't appear in git history
#   2. Teammates can use their own credentials by setting their own .env
CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

# In-memory store for OAuth state parameters.
# WHY: The OAuth protocol uses a "state" value to prevent CSRF attacks.
# We generate a random state when the user starts OAuth and verify it
# matches when Google calls our callback. We store it in memory because
# the whole OAuth flow happens in seconds on a single server.
# In production you'd use Redis or a DB session table.
_oauth_state_store: dict[str, bool] = {}


def _build_flow() -> Flow:
    """
    Creates a new OAuth Flow object.
    We call this in both /start and /callback — they must use the same
    configuration, but must be separate Flow instances.
    """
    return Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
    )


@router.get("/google/start")
def google_oauth_start():
    """
    Returns a Google authorization URL for the user to visit.

    The frontend should:
      1. Call GET /auth/google/start
      2. Redirect the user's browser to the returned auth_url
      3. Wait — Google will redirect back to /auth/google/callback

    WHY access_type="offline": Without this, Google only gives us a short-lived
    access token (expires in 1 hour). With offline, Google also gives us a
    refresh_token that never expires unless the user revokes it. We need the
    refresh_token to scan Gmail hours or days after the user connected.

    WHY prompt="consent": Forces Google to show the consent screen even if
    the user has connected before. This is the only reliable way to get a
    fresh refresh_token. Without it, repeat logins return access_token only.
    """
    flow = _build_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )

    # Store the state so we can verify it in the callback
    _oauth_state_store[state] = True

    return {
        "auth_url": auth_url,
        "state": state,
        "instructions": "Visit auth_url in your browser to connect Gmail",
    }


@router.get("/google/callback")
def google_oauth_callback(
    code: str,        # Google passes this in the URL query params
    state: str,       # Google echoes back the state we sent
    db: Session = Depends(get_db),
):
    """
    Exchanges the authorization code for tokens and saves the refresh token.

    Google redirects to this URL after the user approves. The URL looks like:
    http://localhost:8000/auth/google/callback?code=ABC&state=XYZ

    FastAPI automatically extracts 'code' and 'state' from the URL params.

    Returns the user_id that the frontend must include in all future requests
    as the X-User-Id header.
    """
    # Verify the state to prevent CSRF.
    # If state is not in our store, someone may be trying to inject a fake callback.
    if state not in _oauth_state_store:
        raise HTTPException(
            status_code=400,
            detail="Invalid state parameter. Start OAuth again at /auth/google/start"
        )
    # Remove the state — it's one-time use
    del _oauth_state_store[state]

    # Exchange the short-lived code for tokens.
    # fetch_token() makes a POST request to Google's token endpoint and
    # populates flow.credentials with access_token and refresh_token.
    flow = _build_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # Call the Gmail API to find out this user's email address.
    # We need the email to create or find the User row.
    # WHY getProfile: it's the simplest Gmail endpoint — returns just the address.
    gmail_service = build("gmail", "v1", credentials=credentials)
    profile = gmail_service.users().getProfile(userId="me").execute()
    email = profile["emailAddress"]

    # Find existing user or create a new one.
    # We use the email as the lookup key because that's what we know from Google.
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # First time this user has connected — create their row
        user = User(email=email)
        db.add(user)
        db.flush()  # flush assigns user.id without committing yet

    # Store the refresh token.
    # WHY: Without this, we can only use Gmail right now (access_token lasts 1hr).
    # With the refresh_token, we can generate new access_tokens anytime.
    # The refresh_token may be None if the user already granted access before
    # and didn't revoke it — that's why we only update if it's not None.
    if credentials.refresh_token:
        user.refresh_token = credentials.refresh_token

    # Create a ScanSettings row for this user if they don't have one yet.
    # This row tracks when we last scanned and how many days back the first scan was.
    settings = db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first()
    if not settings:
        settings = ScanSettings(user_id=user.id, initial_scan_days=90)
        db.add(settings)

    # Commit all changes (new user row, refresh token, scan settings)
    db.commit()

    return {
        "user_id": user.id,
        "email": email,
        "message": "Gmail connected successfully. Copy user_id — you will need it for all other API calls as the X-User-Id header.",
    }