"""
Shared pytest fixtures.

Each test gets a fresh in-memory SQLite database — fast, no external
Postgres needed. The `app.get_db` dependency is overridden so requests
made through `client` use this test session instead of the real DB.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import auth
from app.database import Base, get_db
from app.main import app

# Fake Firebase claims the mock below returns for this exact token string —
# tests never talk to real Firebase, so no network calls or service account
# file are needed to run the suite.
FAKE_TOKEN = "test-firebase-id-token"
FAKE_CLAIMS = {"uid": "test-uid-123", "email": "test@example.com", "name": "Test User"}

FAKE_TOKEN_2 = "test-firebase-id-token-2"
FAKE_CLAIMS_2 = {"uid": "test-uid-456", "email": "other@example.com", "name": "Other User"}

FAKE_TOKEN_DOCTOR = "test-firebase-id-token-doctor"
FAKE_CLAIMS_DOCTOR = {"uid": "test-uid-doctor", "email": "doctor@example.com", "name": "Dr. Test"}

_FAKE_TOKENS = {
    FAKE_TOKEN: FAKE_CLAIMS,
    FAKE_TOKEN_2: FAKE_CLAIMS_2,
    FAKE_TOKEN_DOCTOR: FAKE_CLAIMS_DOCTOR,
}


@pytest.fixture(autouse=True)
def mock_firebase_verification(monkeypatch):
    def _fake_verify(id_token: str) -> dict:
        if id_token in _FAKE_TOKENS:
            return _FAKE_TOKENS[id_token]
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    monkeypatch.setattr(auth, "verify_firebase_token", _fake_verify)


@pytest.fixture()
def db_session():
    # StaticPool keeps a single connection alive for the whole in-memory DB —
    # without it, SQLite hands each new connection a *separate* empty
    # ":memory:" database and every query after create_all() 404s on
    # "no such table".
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    """Simulates a Firebase-signed-in user: syncs the local user row, returns ready-to-use headers."""
    headers = {"Authorization": f"Bearer {FAKE_TOKEN}"}
    client.post("/auth/sync", headers=headers)
    return headers


@pytest.fixture()
def doctor_headers(client, db_session):
    """
    Syncs in a second user, then promotes them to role="doctor" directly via
    the DB session -- there's no API endpoint for granting the doctor role
    (that's an intentional admin-only gap, not something any signed-in user
    can grant themselves through the API).
    """
    from app import models

    headers = {"Authorization": f"Bearer {FAKE_TOKEN_DOCTOR}"}
    client.post("/auth/sync", headers=headers)

    user = db_session.query(models.User).filter(models.User.id == FAKE_CLAIMS_DOCTOR["uid"]).first()
    user.role = "doctor"
    db_session.commit()
    return headers
