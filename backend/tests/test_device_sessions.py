def _create_device(client, auth_headers):
    return client.post("/devices", json={"name": "My Watch"}, headers=auth_headers).json()


def test_start_session(client, auth_headers):
    device = _create_device(client, auth_headers)

    resp = client.post(f"/devices/{device['id']}/sessions", json={}, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["device_id"] == device["id"]
    assert body["connected_at"] is not None
    assert body["disconnected_at"] is None


def test_end_session(client, auth_headers):
    device = _create_device(client, auth_headers)
    session = client.post(
        f"/devices/{device['id']}/sessions", json={}, headers=auth_headers
    ).json()

    resp = client.patch(
        f"/devices/{device['id']}/sessions/{session['id']}",
        json={"disconnect_reason": "out_of_range"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["disconnect_reason"] == "out_of_range"
    assert body["disconnected_at"] is not None


def test_list_sessions_most_recent_first(client, auth_headers):
    device = _create_device(client, auth_headers)
    first = client.post(f"/devices/{device['id']}/sessions", json={}, headers=auth_headers).json()
    second = client.post(f"/devices/{device['id']}/sessions", json={}, headers=auth_headers).json()

    resp = client.get(f"/devices/{device['id']}/sessions", headers=auth_headers)
    assert resp.status_code == 200
    ids = [s["id"] for s in resp.json()]
    assert ids[0] == second["id"]
    assert ids[1] == first["id"]


def test_session_endpoints_require_owned_device(client, auth_headers):
    from tests.conftest import FAKE_TOKEN_2

    device = _create_device(client, auth_headers)

    other_headers = {"Authorization": f"Bearer {FAKE_TOKEN_2}"}
    client.post("/auth/sync", headers=other_headers)

    resp = client.post(f"/devices/{device['id']}/sessions", json={}, headers=other_headers)
    assert resp.status_code == 404


def test_session_endpoints_require_auth(client):
    resp = client.get("/devices/some-id/sessions")
    assert resp.status_code == 401
