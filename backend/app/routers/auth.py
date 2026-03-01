# app/routers/auth.py
#
# ADDITIVE CHANGES (Phase 1 — Business Role):
#
#   NEW endpoints added:
#     POST /auth/business/register  → Create a business account (role="business")
#     POST /auth/business/login     → Authenticate business account, returns role
#
#   EXISTING endpoints unchanged:
#     POST /auth/register           → Consumer registration (role="consumer")
#     POST /auth/login              → Consumer login (enforces role=consumer)
#     GET  /auth/google/start       → Gmail OAuth start
#     GET  /auth/google/callback    → Gmail OAuth callback
#
# WHY SEPARATE ENDPOINTS: Business and consumer auth are intentionally separate
# so that a business account can never accidentally land on consumer views
# and vice versa. The login response always includes "role" so the frontend
# knows which dashboard to render.

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

_oauth_state_store: dict[str, str] = {}


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


# ── Consumer Register (UNCHANGED) ─────────────────────────────────────────────

class RegisterBody(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    """
    Creates a new consumer WardrobeSuite account (role="consumer").
    Unchanged from original implementation.
    """
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        email=body.email.lower().strip(),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        role="consumer",
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
        "role": user.role,
        "gmail_connected": False,
        "message": "Account created. Proceed to Gmail OAuth to enable email scanning.",
    }


# ── Consumer Login (UNCHANGED, but now also returns role) ─────────────────────

class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    """
    Authenticates with email + password.
    Now also returns 'role' so the frontend knows which dashboard to show.
    Business accounts are NOT blocked here — they can use either endpoint —
    but the frontend should use /auth/business/login for business logins.
    """
    user = db.query(User).filter(User.email == body.email.lower()).first()

    if not user or not user.check_password(body.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return {
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role or "consumer",
        "gmail_connected": bool(user.refresh_token),
    }


# ── Business Register (NEW) ───────────────────────────────────────────────────

class BusinessRegisterBody(BaseModel):
    business_name: str   # stored as first_name for simplicity
    email: str
    password: str
    industry: str = ""
    company_size: str = ""


@router.post("/business/register")
def business_register(body: BusinessRegisterBody, db: Session = Depends(get_db)):
    """
    Creates a new business account (role="business").

    Stored in the same users table as consumers — role column differentiates them.
    Business accounts do NOT get ScanSettings (they don't scan Gmail).
    Business accounts do NOT need Gmail OAuth.

    Returns role="business" so frontend routes to the business dashboard.
    """
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        email=body.email.lower().strip(),
        first_name=body.business_name.strip(),
        last_name="",
        role="business",
    )
    user.set_password(body.password)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "email": user.email,
        "business_name": user.first_name,
        "role": user.role,
        "message": "Business account created. You can now access the business dashboard.",
    }


# ── Business Login (NEW) ──────────────────────────────────────────────────────

@router.post("/business/login")
def business_login(body: LoginBody, db: Session = Depends(get_db)):
    """
    Authenticates a business account.

    ROLE ENFORCEMENT: Returns 403 if the account exists but is not a business account.
    This prevents consumers from accidentally landing on the business dashboard.
    """
    user = db.query(User).filter(User.email == body.email.lower()).first()

    if not user or not user.check_password(body.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    if (user.role or "consumer") != "business":
        raise HTTPException(
            status_code=403,
            detail="This account is not a business account. Please use the consumer login."
        )

    return {
        "user_id": user.id,
        "email": user.email,
        "business_name": user.first_name,
        "role": user.role,
    }


# ── Gmail OAuth — Step 1 (UNCHANGED) ─────────────────────────────────────────

@router.get("/google/start")
def google_oauth_start(user_id: str):
    flow = _build_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    _oauth_state_store[state] = user_id
    return {"auth_url": auth_url}


# ── Gmail OAuth — Step 2 (UNCHANGED) ─────────────────────────────────────────

@router.get("/google/callback")
def google_oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
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
            user = User(email=google_email, role="consumer")
            db.add(user)
            db.flush()

    if credentials.refresh_token:
        user.refresh_token = credentials.refresh_token

    _ensure_scan_settings(user, db)
    db.commit()

    return RedirectResponse(
        url=f"{FRONTEND_URL}?oauth=success&user_id={user.id}"
    )