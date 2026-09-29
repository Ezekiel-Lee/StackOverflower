"""
Small helpers shared across routers and the normalizer service.

Extracted here (rather than left in devices_router.py / sensor_data_router.py)
specifically to avoid a circular import: normalizer/service.py needs the
threshold-check logic, devices_router.py needs to call the normalizer
service, and sensor_data_router.py needs the device-ownership check --
having any of those three import each other directly creates a cycle.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models


def get_owned_device(device_id: str, current_user: models.User, db: Session) -> models.Device:
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device or device.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


def check_thresholds(reading: models.SensorReading, user: models.User, db: Session) -> None:
    """After a reading is ingested (from any source -- manual POST or a
    normalizer sync), check the user's enabled alert rules for that sensor
    type and create a Notification for each one it breaches."""
    rules = (
        db.query(models.AlertRule)
        .filter(
            models.AlertRule.user_id == user.id,
            models.AlertRule.sensor_type == reading.sensor_type,
            models.AlertRule.enabled.is_(True),
        )
        .all()
    )
    for rule in rules:
        breached = (
            (rule.minimum_value is not None and reading.value < rule.minimum_value)
            or (rule.maximum_value is not None and reading.value > rule.maximum_value)
        )
        if breached:
            db.add(
                models.Notification(
                    user_id=user.id,
                    severity="warning",
                    message=f"{reading.sensor_type} reading {reading.value} outside threshold "
                    f"({rule.minimum_value}-{rule.maximum_value})",
                )
            )
    db.commit()
