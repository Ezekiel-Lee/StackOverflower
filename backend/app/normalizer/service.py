from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app import models
from app.normalizer.base import VendorAuthError
from app.normalizer.registry import get_adapter
from app.sensors import normalize_sensor_type
from app.services import check_thresholds as _check_thresholds

# Readings older than this are never fetched, even on a device's very first
# sync -- avoids accidentally pulling a vendor's entire multi-year history
# the first time a device is connected.
_MAX_BACKFILL_HOURS = 24


class DeviceNotLinkedError(Exception):
    """Raised when a device has no vendor set, or no stored credential."""


def sync_device(device: models.Device, db: Session) -> int:
    """
    Pulls new readings for one device through its vendor's adapter, converts
    them via the normalizer, and feeds them into the same ingestion +
    alert-rule pipeline POST /devices/{id}/data already uses -- so alert
    rules and notifications behave identically whether a reading arrived
    from a manual POST or from a normalizer sync.

    Returns the number of readings synced. Raises DeviceNotLinkedError or
    VendorAuthError (from app.normalizer.base) on failure -- the caller
    (patients/devices router) is responsible for turning those into the
    right HTTP status code.
    """
    if not device.vendor:
        raise DeviceNotLinkedError(f"Device {device.id} has no vendor set")
    if device.credential is None:
        raise DeviceNotLinkedError(f"Device {device.id} has no stored vendor credential")

    adapter = get_adapter(device.vendor)

    since = device.last_synced_at
    earliest_allowed = datetime.utcnow() - timedelta(hours=_MAX_BACKFILL_HOURS)
    if since is None or since < earliest_allowed:
        since = earliest_allowed

    readings = adapter.fetch_readings(device.credential.access_token, since=since)

    owner = device.owner
    stored = 0
    for normalized in readings:
        sensor_type = normalize_sensor_type(normalized.sensor_type)
        if device.supported_sensors is not None and sensor_type not in device.supported_sensors:
            continue
        reading = models.SensorReading(
            device_id=device.id,
            sensor_type=sensor_type,
            value=normalized.value,
            unit=normalized.unit,
            recorded_at=normalized.recorded_at,
            quality_status=normalized.quality_status,
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        _check_thresholds(reading, owner, db)
        stored += 1

    battery = adapter.fetch_battery_level(device.credential.access_token)
    if battery is not None:
        device.battery_level = battery

    device.last_synced_at = datetime.utcnow()
    db.commit()

    return stored
