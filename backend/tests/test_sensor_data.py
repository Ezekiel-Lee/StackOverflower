def _create_device(client, auth_headers, name="Test Watch"):
    return client.post("/devices", json={"name": name}, headers=auth_headers).json()


def test_ingest_reading(client, auth_headers):
    device = _create_device(client, auth_headers)

    resp = client.post(
        f"/devices/{device['id']}/data",
        json={"sensor_type": "heartRate", "value": 72, "unit": "bpm"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["sensor_type"] == "heartRate"
    assert body["value"] == 72


def test_ingest_reading_requires_owned_device(client, auth_headers):
    fake_device_id = "00000000-0000-0000-0000-000000000000"
    resp = client.post(
        f"/devices/{fake_device_id}/data",
        json={"sensor_type": "heartRate", "value": 72},
        headers=auth_headers,
    )
    assert resp.status_code == 404


def test_get_history_returns_readings_in_order(client, auth_headers):
    device = _create_device(client, auth_headers)

    for value in [60, 65, 70]:
        client.post(
            f"/devices/{device['id']}/data",
            json={"sensor_type": "heartRate", "value": value, "unit": "bpm"},
            headers=auth_headers,
        )

    resp = client.get(f"/devices/{device['id']}/data", headers=auth_headers)
    assert resp.status_code == 200
    values = [r["value"] for r in resp.json()]
    assert values == [60, 65, 70]


def test_get_history_filters_by_sensor_type(client, auth_headers):
    device = _create_device(client, auth_headers)
    client.post(
        f"/devices/{device['id']}/data",
        json={"sensor_type": "heartRate", "value": 72},
        headers=auth_headers,
    )
    client.post(
        f"/devices/{device['id']}/data",
        json={"sensor_type": "steps", "value": 500},
        headers=auth_headers,
    )

    resp = client.get(
        f"/devices/{device['id']}/data",
        params={"sensor_type": "steps"},
        headers=auth_headers,
    )
    body = resp.json()
    assert len(body) == 1
    assert body[0]["sensor_type"] == "steps"


def test_ingest_breaching_threshold_creates_notification(client, auth_headers):
    device = _create_device(client, auth_headers)

    client.post(
        "/alert-rules",
        json={"sensor_type": "heartRate", "minimum_value": 50, "maximum_value": 100, "enabled": True},
        headers=auth_headers,
    )

    client.post(
        f"/devices/{device['id']}/data",
        json={"sensor_type": "heartRate", "value": 150},  # breaches max of 100
        headers=auth_headers,
    )

    resp = client.get("/notifications", headers=auth_headers)
    assert resp.status_code == 200
    notifications = resp.json()
    assert len(notifications) == 1
    assert "heartRate" in notifications[0]["message"]


def test_ingest_within_threshold_creates_no_notification(client, auth_headers):
    device = _create_device(client, auth_headers)

    client.post(
        "/alert-rules",
        json={"sensor_type": "heartRate", "minimum_value": 50, "maximum_value": 100, "enabled": True},
        headers=auth_headers,
    )

    client.post(
        f"/devices/{device['id']}/data",
        json={"sensor_type": "heartRate", "value": 72},  # within range
        headers=auth_headers,
    )

    resp = client.get("/notifications", headers=auth_headers)
    assert resp.json() == []
