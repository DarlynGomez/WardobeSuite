# app/routers/auth.py
#
# Routes:
#   POST /auth/register            → Create account (consumer or business)
#   POST /auth/login               → Sign in, get user_id + account_type back
#   GET  /auth/google/start        → Get Google OAuth URL
#   GET  /auth/google/callback     → Google redirects here; we redirect to frontend

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

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# In-memory CSRF state store: state → user_id
_oauth_state_store: dict[str, str] = {}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_flow() -> Flow:
    return Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback"),
    )


def _ensure_scan_settings(user: User, db: Session):
    if not db.query(ScanSettings).filter(ScanSettings.user_id == user.id).first():
        db.add(ScanSettings(user_id=user.id, initial_scan_days=90))


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    first_name: str
    last_name: str = ""
    email: str
    password: str
    account_type: str = "consumer"   # "consumer" | "business"


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """
    Creates a new account. Supports both consumer and business account types.
    Returns user_id + account_type so the frontend routes to the right dashboard.
    """
    if body.account_type not in ("consumer", "business"):
        raise HTTPException(status_code=400, detail="account_type must be 'consumer' or 'business'.")

    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        email=body.email.lower().strip(),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        account_type=body.account_type,
    )
    user.set_password(body.password)
    db.add(user)
    db.flush()

    _ensure_scan_settings(user, db)
    db.commit()

    return {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "account_type": user.account_type,
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
    Returns account_type so the frontend knows which dashboard to show.
    """
    user = db.query(User).filter(User.email == body.email.lower()).first()

    if not user or not user.check_password(body.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "account_type": user.account_type or "consumer",
        "gmail_connected": bool(user.refresh_token),
    }


# ── Gmail OAuth — Step 1: get auth URL ───────────────────────────────────────

@router.get("/google/start")
def google_oauth_start(user_id: str):
    """
    Returns a Google authorization URL.
    Frontend opens this URL; Google redirects to /auth/google/callback.
    """
    flow = _build_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    _oauth_state_store[state] = user_id
    return {"auth_url": auth_url}


# ── Gmail OAuth — Step 2: exchange code for token ────────────────────────────

@router.get("/google/callback")
def google_oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    """
    Google redirects here after the user approves Gmail access.
    Stores the refresh_token then redirects back to the frontend.
    """
    user_id = _oauth_state_store.pop(state, None)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid OAuth state. Please try connecting Gmail again.")

    flow = _build_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        gmail_service = build("gmail", "v1", credentials=credentials)
        profile = gmail_service.users().getProfile(userId="me").execute()
        google_email = profile["emailAddress"]
        user = db.query(User).filter(User.email == google_email).first()
        if not user:
            user = User(email=google_email)
            db.add(user)
            db.flush()

    if credentials.refresh_token:
        user.refresh_token = credentials.refresh_token

    _ensure_scan_settings(user, db)
    db.commit()

    # Redirect browser back to frontend with oauth=success so React can start scanning
    return RedirectResponse(
        url=f"{FRONTEND_URL}?oauth=success&user_id={user.id}"
    )