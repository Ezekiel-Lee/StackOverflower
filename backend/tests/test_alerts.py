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
