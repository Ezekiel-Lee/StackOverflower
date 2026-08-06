from tests.conftest import FAKE_TOKEN


def test_sync_creates_user_on_first_call(client):
    resp = client.post("/auth/sync", headers={"Authorization": f"Bearer {FAKE_TOKEN}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "test@example.com"
    assert body["id"] == "test-uid-123"


def test_sync_is_idempotent_on_repeat_calls(client):
    headers = {"Authorization": f"Bearer {FAKE_TOKEN}"}
    first = client.post("/auth/sync", headers=headers).json()
    second = client.post("/auth/sync", headers=headers).json()
    assert first["id"] == second["id"]


def test_sync_rejects_invalid_token(client):
    resp = client.post("/auth/sync", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_me_requires_valid_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_requires_user_to_have_synced_first(client):
    # Valid Firebase token, but /auth/sync was never called -- no local row yet.
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {FAKE_TOKEN}"})
    assert resp.status_code == 401


def test_me_returns_current_user_after_sync(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"
