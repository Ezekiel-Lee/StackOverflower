"""
Canonical sensor types and the single alias map used by ingest, sync,
device capability lists, and the development seed script.

Keep vendor/BLE field names out of this module — adapters map those into
these names before a reading is stored.
"""
from datetime import datetime, timedelta, timezone
from typing import Iterable, List, Optional, Sequence

HEART_RATE = "heartRate"
STEP_COUNT = "stepCount"
BLOOD_OXYGEN = "bloodOxygen"
STRESS = "stress"
ACTIVE_ENERGY = "activeEnergy"
SLEEP = "sleep"

# `stress` is reserved so devices can declare support, but this codebase
# does not define a scale and must not invent fake stress readings.
CANONICAL_SENSOR_TYPES = (
    HEART_RATE,
    STEP_COUNT,
    BLOOD_OXYGEN,
    STRESS,
    ACTIVE_ENERGY,
    SLEEP,
)

SENSOR_UNITS = {
    HEART_RATE: "bpm",
    STEP_COUNT: "steps",
    BLOOD_OXYGEN: "percent",
    ACTIVE_ENERGY: "kcal",
    SLEEP: "minutes",
}

SENSOR_TYPE_ALIASES = {
    "steps": STEP_COUNT,
}

GENERATABLE_SENSOR_TYPES = (
    HEART_RATE,
    STEP_COUNT,
    BLOOD_OXYGEN,
    ACTIVE_ENERGY,
    SLEEP,
)

_SEED_SERIES = {
    HEART_RATE: [72, 78, 75, 83, 80, 88, 82, 92, 85, 79],
    STEP_COUNT: [100, 450, 1200, 2300, 4100, 6500, 8200],
    BLOOD_OXYGEN: [97, 98, 97, 99, 96],
    ACTIVE_ENERGY: [35, 80, 150, 240, 330],
    SLEEP: [420, 465],
}


def normalize_sensor_type(sensor_type: str) -> str:
    """Map a known alias onto its canonical name; otherwise return the trimmed value."""
    if sensor_type is None:
        raise ValueError("sensor_type must not be blank")
    trimmed = sensor_type.strip()
    if not trimmed:
        raise ValueError("sensor_type must not be blank")
    return SENSOR_TYPE_ALIASES.get(trimmed, trimmed)


def normalize_sensor_list(sensor_types: Optional[Sequence[str]]) -> Optional[List[str]]:
    """Normalise a capability list. None stays None (undeclared); [] stays []."""
    if sensor_types is None:
        return None
    seen: List[str] = []
    for raw in sensor_types:
        name = normalize_sensor_type(raw)
        if name not in seen:
            seen.append(name)
    return seen


def parse_supported_sensors_csv(raw: str) -> List[str]:
    parts = [part.strip() for part in raw.split(",")]
    return normalize_sensor_list([part for part in parts if part]) or []


def _iso_utc(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_seed_readings(
    supported_sensors: Iterable[str],
    now: Optional[datetime] = None,
) -> tuple[List[dict], List[str]]:
    """
    Build chronological POST /devices/{id}/data payloads for development.

    Returns (payloads, skipped_types). `stress` is always skipped if listed.
    Types without a generator are also skipped.
    """
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)

    payloads: List[dict] = []
    skipped: List[str] = []
    requested = normalize_sensor_list(list(supported_sensors)) or []

    for sensor_type in requested:
        if sensor_type == STRESS or sensor_type not in _SEED_SERIES:
            skipped.append(sensor_type)
            continue
        values = _SEED_SERIES[sensor_type]
        unit = SENSOR_UNITS[sensor_type]
        interval = timedelta(hours=24) if sensor_type == SLEEP else timedelta(minutes=60)
        start = moment - interval * (len(values) - 1)
        for index, value in enumerate(values):
            payloads.append(
                {
                    "sensor_type": sensor_type,
                    "value": value,
                    "unit": unit,
                    "recorded_at": _iso_utc(start + interval * index),
                    "quality_status": "ok",
                }
            )

    payloads.sort(key=lambda item: item["recorded_at"])
    return payloads, skipped
