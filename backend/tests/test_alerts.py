def test_create_alert_rule(client, auth_headers):
    resp = client.post(
        "/alert-rules",
        json={"sensor_type": "heartRate", "minimum_value": 50, "maximum_value": 120, "enabled": True},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["sensor_type"] == "heartRate"
    assert body["enabled"] is True


def test_list_alert_rules_only_returns_own(client, auth_headers):
    client.post(
        "/alert-rules",
        json={"sensor_type": "heartRate", "minimum_value": 50, "maximum_value": 120},
        headers=auth_headers,
    )

    resp = client.get("/alert-rules", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_alert_rules_require_auth(client):
    resp = client.get("/alert-rules")
    assert resp.status_code == 401


def _create_breaching_notification(client, auth_headers):
    """Sets up a device + alert rule + a reading that breaches it, producing one notification."""
    device = client.post("/devices", json={"name": "My Watch"}, headers=auth_headers).json()
    client.post(
        "/alert-rules",
        json={"sensor_type": "heartRate", "minimum_value": 50, "maximum_value": 100, "enabled": True},
        headers=auth_headers,
    )
    client.post(
        f"/devices/{device['id']}/data",
        json={"sensor_type": "heartRate", "value": 150},
        headers=auth_headers,
    )
    return client.get("/notifications", headers=auth_headers).json()[0]


def test_mark_notification_read(client, auth_headers):
    notification = _create_breaching_notification(client, auth_headers)
    assert notification["read_at"] is None

    resp = client.patch(f"/notifications/{notification['id']}/read", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["read_at"] is not None


def test_mark_notification_read_requires_ownership(client, auth_headers):
    from tests.conftest import FAKE_TOKEN_2

    notification = _create_breaching_notification(client, auth_headers)

    other_headers = {"Authorization": f"Bearer {FAKE_TOKEN_2}"}
    client.post("/auth/sync", headers=other_headers)

    resp = client.patch(f"/notifications/{notification['id']}/read", headers=other_headers)
    assert resp.status_code == 404


def test_mark_notification_read_requires_auth(client):
    resp = client.patch("/notifications/some-id/read")
    assert resp.status_code == 401
