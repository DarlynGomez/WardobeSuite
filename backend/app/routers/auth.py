# app/routers/auth.py
#
# Authentication routes:
#
#   POST /auth/register        → Create account with name + email + password
#   POST /auth/login           → Sign in, get back user_id
#   GET  /auth/google/start    → Get Google OAuth URL (pass ?user_id= to link)
#   GET  /auth/google/callback → Google redirects here after user grants access;
#                                 redirects browser to frontend with user_id in URL

import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dotenv import load_dotenv

from app.database import get_db
from app.models import User, ScanSettings

load_dotenv()

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

# URL of the frontend — after OAuth we redirect here so the browser ends up
# back on the React app with the user_id in the URL hash.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# In-memory CSRF state store. Maps state→user_id so the callback knows which
# account to link the Gmail tokens to.
_oauth_state_store: dict[str, str] = {}   # state → user_id

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_flow() -> Flow:
    return Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback"),
    )


def _ensure_scan_settings(user: User, db: Session):
    """Create a ScanSettings row for this user if they don't have one."""
    if not db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first():
        db.add(ScanSettings(user_id=user.id, initial_scan_days=90))


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """
    Creates a new WardrobeSuite account.

    Stores a salted SHA-256 hash of the password — never the plaintext.
    Returns user_id immediately so the frontend can proceed to Gmail OAuth
    without making the user log in again.
    """
    # Check for duplicate email
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        email=body.email.lower().strip(),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
    )
    user.set_password(body.password)
    db.add(user)
    db.flush()  # get user.id before commit

    _ensure_scan_settings(user, db)
    db.commit()

    return {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "gmail_connected": False,
        "message": "Account created. Proceed to Gmail OAuth to enable email scanning.",
    }


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    """
    Authenticates with email + password.
    Returns user_id and gmail_connected so the frontend knows whether to
    prompt for Gmail OAuth or go straight to the dashboard.
    """
    user = db.query(User).filter(User.email == body.email.lower()).first()

    if not user or not user.check_password(body.password):
        # Deliberately vague — don't reveal whether the email exists
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "gmail_connected": bool(user.refresh_token),
    }


# ── Gmail OAuth — Step 1: get auth URL ───────────────────────────────────────

@router.get("/google/start")
def google_oauth_start(user_id: str):
    """
    Returns a Google authorization URL.

    The frontend should:
      1. Call GET /auth/google/start?user_id=<id>
      2. Open the returned auth_url in a new tab (or redirect)
      3. Google redirects back to /auth/google/callback
      4. The callback redirects back to the frontend with user_id in the URL

    WHY user_id param: We need to know which User row to attach the Gmail
    refresh_token to. The state parameter carries it through the OAuth round-trip.
    """
    flow = _build_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    # Store user_id keyed by state for retrieval in callback
    _oauth_state_store[state] = user_id

    return {"auth_url": auth_url}


# ── Gmail OAuth — Step 2: exchange code for token ────────────────────────────

@router.get("/google/callback")
def google_oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    """
    Google redirects here after the user approves Gmail access.

    1. Validate state (CSRF protection)
    2. Exchange code for tokens
    3. Store refresh_token on the User row
    4. Redirect the browser back to the frontend with ?oauth=success&user_id=...
       so the React app knows OAuth finished and can start scanning.
    """
    user_id = _oauth_state_store.pop(state, None)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid OAuth state. Please try connecting Gmail again.")

    flow = _build_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # Look up or find user
    user = db.query(User).filter(User.id == user_id).first()

    # If the user somehow wasn't created yet (e.g. they used OAuth-only signup),
    # look them up by their Google email address
    if not user:
        gmail_service = build("gmail", "v1", credentials=credentials)
        profile = gmail_service.users().getProfile(userId="me").execute()
        google_email = profile["emailAddress"]
        user = db.query(User).filter(User.email == google_email).first()
        if not user:
            user = User(email=google_email)
            db.add(user)
            db.flush()

    # Save the refresh token so we can scan Gmail without re-auth
    if credentials.refresh_token:
        user.refresh_token = credentials.refresh_token

    _ensure_scan_settings(user, db)
    db.commit()

    # Redirect browser back to the frontend. The React app listens for
    # ?oauth=success in the URL and auto-starts the Gmail scan.
    return RedirectResponse(
        url=f"{FRONTEND_URL}?oauth=success&user_id={user.id}"
    )