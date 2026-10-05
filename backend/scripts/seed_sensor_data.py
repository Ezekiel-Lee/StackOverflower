"""
Development-only sensor seed script.

Posts chronological fake readings through the existing FastAPI ingest
endpoint. Does not write to the database (or Supabase) directly.

Required environment variables:
  API_BASE_URL
  DEVICE_ID
  FIREBASE_TOKEN
  SUPPORTED_SENSORS   comma-separated canonical names

Example:

  API_BASE_URL=http://localhost:8000
  DEVICE_ID=<device uuid>
  FIREBASE_TOKEN=<temporary firebase id token>
  SUPPORTED_SENSORS=heartRate,stepCount,bloodOxygen,activeEnergy,sleep
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

# Allow `python scripts/seed_sensor_data.py` from backend/ or repo root.
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.sensors import generate_seed_readings, parse_supported_sensors_csv  # noqa: E402


def _require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def seed(
    api_base_url: str,
    device_id: str,
    firebase_token: str,
    supported_sensors: list[str],
) -> int:
    base = api_base_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {firebase_token}",
        "Content-Type": "application/json",
    }

    patch = requests.patch(
        f"{base}/devices/{device_id}",
        json={"supported_sensors": supported_sensors},
        headers=headers,
        timeout=30,
    )
    if patch.status_code != 200:
        raise SystemExit(
            f"Failed to PATCH device capabilities ({patch.status_code}): {patch.text}"
        )

    payloads, skipped = generate_seed_readings(supported_sensors)
    for sensor_type in skipped:
        if sensor_type == "stress":
            print("Skipping stress: no scale is defined; not generating fake stress readings.")
        else:
            print(f"Skipping {sensor_type}: no development generator is defined.")

    created = 0
    for payload in payloads:
        resp = requests.post(
            f"{base}/devices/{device_id}/data",
            json=payload,
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 201:
            raise SystemExit(
                f"Failed to ingest {payload['sensor_type']} ({resp.status_code}): {resp.text}"
            )
        created += 1

    print(
        f"Seeded {created} readings for device {device_id} "
        f"({', '.join(supported_sensors) or 'none'})."
    )
    return created


def main() -> None:
    api_base_url = _require_env("API_BASE_URL")
    device_id = _require_env("DEVICE_ID")
    firebase_token = _require_env("FIREBASE_TOKEN")
    supported_raw = _require_env("SUPPORTED_SENSORS")
    supported_sensors = parse_supported_sensors_csv(supported_raw)
    seed(api_base_url, device_id, firebase_token, supported_sensors)


if __name__ == "__main__":
    main()
