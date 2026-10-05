def _create_device(client, auth_headers):
    return client.post("/devices", json={"name": "My Watch"}, headers=auth_headers).json()


def test_sync_fails_before_vendor_linked(client, auth_headers):
    device = _create_device(client, auth_headers)

    resp = client.post(f"/devices/{device['id']}/sync", headers=auth_headers)
    assert resp.status_code == 409


def test_link_vendor_rejects_unknown_vendor(client, auth_headers):
    device = _create_device(client, auth_headers)

    resp = client.post(
        f"/devices/{device['id']}/link-vendor",
        json={"vendor": "not-a-real-vendor", "access_token": "abc"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_link_vendor_then_sync_ingests_readings(client, auth_headers):
    device = _create_device(client, auth_headers)

    link_resp = client.post(
        f"/devices/{device['id']}/link-vendor",
        json={"vendor": "mock", "access_token": "fake-vendor-token"},
        headers=auth_headers,
    )
    assert link_resp.status_code == 200
    assert link_resp.json()["vendor"] == "mock"

    sync_resp = client.post(f"/devices/{device['id']}/sync", headers=auth_headers)
    assert sync_resp.status_code == 200
    body = sync_resp.json()
    assert body["readings_synced"] > 0
    assert body["battery_level"] is not None

    history = client.get(f"/devices/{device['id']}/data", headers=auth_headers).json()
    assert len(history) == body["readings_synced"]
    types = {r["sensor_type"] for r in history}
    assert "heartRate" in types
    assert "stepCount" in types
    assert "stress" not in types


def test_sync_triggers_alert_notification_on_breach(client, auth_headers):
    device = _create_device(client, auth_headers)
    client.post(
        f"/devices/{device['id']}/link-vendor",
        json={"vendor": "mock", "access_token": "fake-vendor-token"},
        headers=auth_headers,
    )
    # Mock adapter generates heart rate between 58-100 bpm; a rule this tight
    # is guaranteed to be breached by at least one synced reading.
    client.post(
        "/alert-rules",
        json={"sensor_type": "heartRate", "minimum_value": 59, "maximum_value": 59, "enabled": True},
        headers=auth_headers,
    )

    client.post(f"/devices/{device['id']}/sync", headers=auth_headers)

    notifications = client.get("/notifications", headers=auth_headers).json()
    assert any("heartRate" in n["message"] for n in notifications)


def test_sync_requires_owned_device(client, auth_headers):
    from tests.conftest import FAKE_TOKEN_2

    device = _create_device(client, auth_headers)
    client.post(
        f"/devices/{device['id']}/link-vendor",
        json={"vendor": "mock", "access_token": "fake-vendor-token"},
        headers=auth_headers,
    )

    other_headers = {"Authorization": f"Bearer {FAKE_TOKEN_2}"}
    client.post("/auth/sync", headers=other_headers)

    resp = client.post(f"/devices/{device['id']}/sync", headers=other_headers)
    assert resp.status_code == 404


def test_sync_requires_auth(client):
    resp = client.post("/devices/some-id/sync")
    assert resp.status_code == 401


def test_sync_filters_to_declared_supported_sensors(client, auth_headers):
    device = client.post(
        "/devices",
        json={"name": "Limited Watch", "supported_sensors": ["heartRate", "stepCount"]},
        headers=auth_headers,
    ).json()
    client.post(
        f"/devices/{device['id']}/link-vendor",
        json={"vendor": "mock", "access_token": "fake-vendor-token"},
        headers=auth_headers,
    )

    sync_resp = client.post(f"/devices/{device['id']}/sync", headers=auth_headers)
    assert sync_resp.status_code == 200
    history = client.get(f"/devices/{device['id']}/data", headers=auth_headers).json()
    types = {r["sensor_type"] for r in history}
    assert types == {"heartRate", "stepCount"}
    assert sync_resp.json()["readings_synced"] == len(history)
