def test_register_device(client, auth_headers):
    resp = client.post(
        "/devices",
        json={"name": "My Watch", "model": "ESP32-Proto", "ble_identifier": "AA:BB:CC:DD:EE:FF"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "My Watch"
    assert "id" in body


def test_list_devices_only_returns_own_devices(client, auth_headers):
    client.post("/devices", json={"name": "Watch A"}, headers=auth_headers)
    client.post("/devices", json={"name": "Watch B"}, headers=auth_headers)

    resp = client.get("/devices", headers=auth_headers)
    assert resp.status_code == 200
    names = {d["name"] for d in resp.json()}
    assert names == {"Watch A", "Watch B"}


def test_rename_device(client, auth_headers):
    created = client.post("/devices", json={"name": "Old Name"}, headers=auth_headers).json()

    resp = client.patch(
        f"/devices/{created['id']}", json={"name": "New Name"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_remove_device(client, auth_headers):
    created = client.post("/devices", json={"name": "Temp Watch"}, headers=auth_headers).json()

    delete_resp = client.delete(f"/devices/{created['id']}", headers=auth_headers)
    assert delete_resp.status_code == 204

    list_resp = client.get("/devices", headers=auth_headers)
    assert created["id"] not in [d["id"] for d in list_resp.json()]


def test_device_endpoints_require_auth(client):
    resp = client.get("/devices")
    assert resp.status_code == 401


def test_cannot_access_another_users_device(client, auth_headers):
    from tests.conftest import FAKE_TOKEN_2

    device = client.post("/devices", json={"name": "Alice's Watch"}, headers=auth_headers).json()

    # sync in as a second Firebase user
    other_headers = {"Authorization": f"Bearer {FAKE_TOKEN_2}"}
    client.post("/auth/sync", headers=other_headers)

    resp = client.patch(
        f"/devices/{device['id']}", json={"name": "Hijacked"}, headers=other_headers
    )
    assert resp.status_code == 404
