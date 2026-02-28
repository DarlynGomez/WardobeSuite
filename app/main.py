# app/main.py
#
# WHY THIS FILE: This is the entry point for the FastAPI application.
# It creates the app object, registers middleware (like CORS), registers
# routers (groups of endpoints), and triggers database table creation on startup.
#
# We import everything lazily: routers are added as we build them in later
# milestones. This file should not crash even when routers are empty.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the engine and Base so we can call create_all to build tables
from app.database import engine, Base

# Import all models so that Base.metadata knows about them.
# Even though we don't use these names directly here, importing them
# "registers" them with Base. Without these imports, create_all would
# create zero tables because Base wouldn't know any models exist.
import app.models  # noqa: F401 — imported for side effect (table registration)

# Create the FastAPI application object.
# title appears in the auto-generated docs at /docs
app = FastAPI(title="Wardrobe Backend — Developer 1")

# CORS middleware allows the frontend (running on a different port or domain)
# to make requests to this backend.
# allow_origins=["*"] means ANY frontend can call us — fine for hackathon.
# In production you would list specific domains instead.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Database table creation ───────────────────────────────────────────────────
# This runs when the server starts. It checks which tables exist in wardrobe.db
# and creates any that are missing. It does NOT drop or modify existing tables.
# So running this multiple times is safe.
Base.metadata.create_all(bind=engine)


# ── Health check endpoint ─────────────────────────────────────────────────────
# A simple endpoint that returns {"status": "ok"}.
# Used to confirm the server is running before testing real endpoints.
@app.get("/")
def health_check():
    return {"status": "ok"}


# Register the auth router.
# prefix="/auth" means all routes in auth.py are available at /auth/...
# tags=["auth"] groups them together in the /docs UI
from app.routers import auth, scan
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(scan.router, prefix="/scan", tags=["scan"])

# NOTE: We will add review router in the next milestone:
# from app.routers import review
# app.include_router(review.router, tags=["review"])