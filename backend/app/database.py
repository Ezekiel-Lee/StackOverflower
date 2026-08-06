"""
Database connection and session management.

Uses SQLAlchemy 2.0 style with the psycopg3 driver (not psycopg2 — psycopg2
doesn't yet ship working wheels for very new Python versions like 3.14, and
building it from source requires a C compiler + Postgres headers most
teammates won't have set up).
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/dss_wearable",
)

# If someone sets DATABASE_URL as a plain "postgresql://..." (e.g. copied
# straight from Supabase), upgrade it to use the psycopg3 driver rather than
# falling back to psycopg2, which may not be installed.
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request, closes after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
