# app/database.py
#
# WHY THIS FILE: SQLAlchemy needs to know WHERE the database is and HOW to
# connect to it. This file sets that up once, and every other file imports
# from here instead of re-creating the connection.

import uuid
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# The database URL tells SQLAlchemy what kind of DB and where the file is.
# "sqlite:///./wardrobe.db" means:
#   - sqlite  = use SQLite (a file-based database, no server needed)
#   - ///     = three slashes means "relative path"
#   - ./wardrobe.db = the file will be created in whatever folder you run
#                     uvicorn from (the project root)
SQLALCHEMY_DATABASE_URL = "sqlite:///./wardrobe.db"

# The engine is the actual database connection.
# check_same_thread=False is required for SQLite + FastAPI because FastAPI
# handles requests in threads, and SQLite's default is to complain if you
# use a connection from a different thread than the one that created it.
# Setting this to False tells SQLite to allow it (safe for our use case).
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal is a factory — calling SessionLocal() creates a new "session".
# A session is a unit of work: you open it, do reads/writes, then close it.
# autocommit=False means changes are NOT saved until you call db.commit()
# autoflush=False means SQLAlchemy won't auto-sync state to DB mid-session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all our table models inherit from.
# When we call Base.metadata.create_all(engine), SQLAlchemy looks at every
# class that inherited from Base and creates the corresponding table in SQLite
# if it doesn't already exist.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that opens a DB session per request and closes it
    when the request is done, even if an error occurred.

    Usage in a route:
        def my_route(db: Session = Depends(get_db)):
            ...

    WHY A GENERATOR: Using 'yield' instead of 'return' lets FastAPI run the
    code after 'yield' (the finally block) after the response is sent.
    This guarantees the session is always closed.
    """
    db = SessionLocal()
    try:
        yield db          # FastAPI injects this db object into the route
    finally:
        db.close()        # Always runs, even if the route raised an exception


def generate_uuid() -> str:
    """
    Returns a new random UUID string.
    We use this as the default value for id columns.
    WHY A FUNCTION: SQLAlchemy calls this function each time a new row is
    created. If we used uuid.uuid4() directly (not wrapped in a function),
    it would generate ONE UUID at class definition time and reuse it for
    every row — which would cause a unique constraint violation immediately.
    """
    return str(uuid.uuid4())