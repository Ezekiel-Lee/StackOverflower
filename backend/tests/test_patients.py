def test_patient_defaults_to_patient_role(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "patient"


def test_patient_cannot_search_patients(client, auth_headers):
    resp = client.get("/patients/search", params={"query": "a"}, headers=auth_headers)
    assert resp.status_code == 403


def test_patients_endpoints_require_auth(client):
    resp = client.get("/patients/search", params={"query": "a"})
    assert resp.status_code == 401


def test_doctor_can_search_patients_by_name(client, auth_headers, doctor_headers):
    # auth_headers syncs in "Test User" (role defaults to patient)
    resp = client.get("/patients/search", params={"query": "Test"}, headers=doctor_headers)
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert "Test User" in names


def test_doctor_search_excludes_other_doctors(client, auth_headers, doctor_headers):
    # The doctor themself should never show up in a patient search.
    resp = client.get("/patients/search", params={"query": "Dr"}, headers=doctor_headers)
    assert resp.status_code == 200
    assert all(p["name"] != "Dr. Test" for p in resp.json())


def test_doctor_can_view_patient_details(client, auth_headers, doctor_headers):
    me = client.get("/auth/me", headers=auth_headers).json()

    resp = client.get(f"/patients/{me['id']}", headers=doctor_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == me["email"]


def test_patient_cannot_view_own_record_via_patients_endpoint(client, auth_headers):
    me = client.get("/auth/me", headers=auth_headers).json()

    resp = client.get(f"/patients/{me['id']}", headers=auth_headers)
    assert resp.status_code == 403


def test_doctor_can_edit_patient_details(client, auth_headers, doctor_headers):
    me = client.get("/auth/me", headers=auth_headers).json()

    resp = client.patch(
        f"/patients/{me['id']}",
        json={"age": 42, "medical_details": "No known conditions."},
        headers=doctor_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["age"] == 42
    assert body["medical_details"] == "No known conditions."


def test_get_unknown_patient_returns_404(client, doctor_headers):
    resp = client.get("/patients/does-not-exist", headers=doctor_headers)
    assert resp.status_code == 404
