# DSS Wearable App — API Contract

**Base URL (local dev):** `http://localhost:8000`
**Interactive docs:** `http://localhost:8000/docs` (Swagger, auto-generated — always the source of truth if this doc drifts)

This document is the field-level contract for every endpoint the mobile app calls. If a screen needs a field that isn't listed here, flag it before building the screen — don't guess the shape.

---

## 1. Authentication

Auth is **Firebase Auth**. This backend never sees a password — the mobile app signs in directly with the Firebase SDK and gets an ID token back.

```
Mobile app                    This API                Firebase
-----------                   --------                --------
Sign up / sign in  ---------------------------------->  Firebase Auth SDK
                    <-----------------------------------  ID token
POST /auth/sync
  Authorization: Bearer <id token>  ---->  verify_id_token()
                    <----  local user row created/updated (UserOut)

All other endpoints:
  Authorization: Bearer <id token>  ---->  verified, resolved to local user
```

**Every protected endpoint below requires this header:**
```
Authorization: Bearer <firebase_id_token>
```

**Call `POST /auth/sync` once right after sign-in.** It's the only endpoint that *creates* a local user row — every other endpoint just looks the user up. Calling a protected endpoint before syncing returns `401` with a message telling you to sync first.

`users.id` is the Firebase UID itself (not a separately generated ID) — use it directly wherever a user reference is needed.

---

## 2. Auth Endpoints

### `POST /auth/sync`
Creates or updates the local user row from the Firebase token's claims. Idempotent — safe to call on every app launch.

**Headers:** `Authorization: Bearer <id token>`
**Body:** none

**Response `200`** — `UserOut`
```json
{
  "id": "firebase-uid-string",
  "email": "user@example.com",
  "name": "Jane Doe",
  "created_at": "2026-08-06T01:00:00"
}
```

### `GET /auth/me`
Returns the current user's profile.

**Headers:** `Authorization: Bearer <id token>`

**Response `200`** — `UserOut` (same shape as above)
**Response `401`** — user not synced yet, or invalid/expired token

---

## 3. Device Endpoints

### `POST /devices`
Register a new wearable device for the current user.

**Headers:** `Authorization: Bearer <id token>`
**Body** — `DeviceCreate`
```json
{
  "name": "My Watch",
  "model": "ESP32-Proto",
  "ble_identifier": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.0.0"
}
```
| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `model` | string | no |
| `ble_identifier` | string | no |
| `firmware_version` | string | no |

**Response `201`** — `DeviceOut`
```json
{
  "id": "device-uuid",
  "owner_id": "firebase-uid-string",
  "name": "My Watch",
  "model": "ESP32-Proto",
  "ble_identifier": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.0.0",
  "created_at": "2026-08-06T01:00:00"
}
```

### `GET /devices`
List all devices owned by the current user.

**Response `200`** — array of `DeviceOut`

### `PATCH /devices/{device_id}`
Rename a device or update its model. Only the owner can do this — any other user's token gets `404` (not `403`, so device existence isn't leaked to non-owners).

**Body** — `DeviceUpdate` (all fields optional, send only what changes)
```json
{ "name": "New Name" }
```

**Response `200`** — updated `DeviceOut`
**Response `404`** — device doesn't exist, or isn't owned by the caller

### `DELETE /devices/{device_id}`
Remove a device (cascades to its sensor readings and sessions).

**Response `204`** — no body
**Response `404`** — same ownership rule as above

---

## 4. Sensor Data Endpoints

### `POST /devices/{device_id}/data`
Ingests one sensor reading.

> **Do not call this per raw BLE sample.** Aggregate/throttle client-side first — either on a fixed interval (10–30s) or only when the value changes meaningfully. This endpoint also runs threshold checks against the user's `alert_rules` and creates a `Notification` if breached.

**Body** — `SensorReadingCreate`
```json
{
  "sensor_type": "heartRate",
  "value": 72,
  "unit": "bpm",
  "recorded_at": "2026-08-06T01:00:00",
  "quality_status": "ok"
}
```
| Field | Type | Required | Notes |
|---|---|---|---|
| `sensor_type` | string | yes | e.g. `"heartRate"`, `"steps"`, `"accelerometer"` — not yet enum-constrained |
| `value` | float | yes | |
| `unit` | string | no | e.g. `"bpm"`, `"steps"`, `"°C"` |
| `recorded_at` | ISO datetime | no | defaults to server time if omitted |
| `quality_status` | string | no | defaults to `"ok"`; e.g. `"invalid"`, `"out_of_range"` |

**Response `201`** — `SensorReadingOut`
**Response `404`** — device doesn't exist / not owned by caller

### `GET /devices/{device_id}/data`
Historical readings — used for charts.

**Query params** (all optional)
| Param | Type | Notes |
|---|---|---|
| `sensor_type` | string | filter to one sensor type |
| `from` | ISO datetime | inclusive lower bound on `recorded_at` |
| `to` | ISO datetime | inclusive upper bound on `recorded_at` |

**Response `200`** — array of `SensorReadingOut`, ordered oldest → newest

---

## 5. Alerts Endpoints

### `POST /alert-rules`
Create a threshold rule for the current user.

**Body** — `AlertRuleCreate`
```json
{
  "sensor_type": "heartRate",
  "minimum_value": 50,
  "maximum_value": 120,
  "enabled": true
}
```
`minimum_value`/`maximum_value` are both optional — set one, both, or neither side of the range.

**Response `201`** — `AlertRuleOut`

### `GET /alert-rules`
List the current user's alert rules.

**Response `200`** — array of `AlertRuleOut`

### `GET /notifications`
List the current user's notifications (newest first), generated automatically when an ingested reading breaches an enabled alert rule.

**Response `200`** — array of `NotificationOut`
```json
{
  "id": "notification-uuid",
  "severity": "warning",
  "message": "heartRate reading 150.0 outside threshold (50.0-120.0)",
  "created_at": "2026-08-06T01:00:00",
  "read_at": null
}
```
`severity` is one of `"info"`, `"warning"`, `"critical"`.

---

## 6. Misc

### `GET /health`
No auth required. Returns `{"status": "ok"}` — use for connectivity checks.

---

## 7. Error Shape

Validation errors (`422`) follow FastAPI's standard shape:
```json
{
  "detail": [
    { "loc": ["body", "value"], "msg": "field required", "type": "missing" }
  ]
}
```
Auth/ownership errors (`401`, `404`) return:
```json
{ "detail": "human-readable message" }
```

---

## 8. Not Yet Implemented

These exist in the data model but have no endpoint yet — flag if your screen needs them so we can prioritize:
- **NFC pairing** (stretch goal per team doc)
- **Multiple simultaneous device connections** (stretch goal)
- **`device_sessions`** (connection history) — modeled in the DB, no API yet
- **AI-based insights** (stretch goal)

---

*Last updated against `schemas.py` as of the Firebase Auth migration. If this doc and `/docs` (Swagger) ever disagree, trust Swagger and flag the mismatch.*
