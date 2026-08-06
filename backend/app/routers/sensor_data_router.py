from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.routers.devices_router import _get_owned_device

router = APIRouter(prefix="/devices/{device_id}/data", tags=["sensor-data"])


@router.post("", response_model=schemas.SensorReadingOut, status_code=201)
def ingest_reading(
    device_id: str,
    payload: schemas.SensorReadingCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingestion endpoint the mobile app calls after receiving BLE data.

    Per team doc: do NOT call this per raw BLE sample — the app should
    aggregate/throttle client-side (10-30s interval or on meaningful
    change) before hitting this endpoint.
    """
    _get_owned_device(device_id, current_user, db)

    reading = models.SensorReading(
        device_id=device_id,
        sensor_type=payload.sensor_type,
        value=payload.value,
        unit=payload.unit,
        recorded_at=payload.recorded_at or datetime.utcnow(),
        quality_status=payload.quality_status,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    _check_thresholds(reading, current_user, db)

    return reading


@router.get("", response_model=List[schemas.SensorReadingOut])
def get_history(
    device_id: str,
    sensor_type: Optional[str] = None,
    from_: Optional[datetime] = Query(None, alias="from"),
    to: Optional[datetime] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Historical readings for charts. Filter by sensor_type and/or a date range."""
    _get_owned_device(device_id, current_user, db)

    q = db.query(models.SensorReading).filter(models.SensorReading.device_id == device_id)
    if sensor_type:
        q = q.filter(models.SensorReading.sensor_type == sensor_type)
    if from_:
        q = q.filter(models.SensorReading.recorded_at >= from_)
    if to:
        q = q.filter(models.SensorReading.recorded_at <= to)

    return q.order_by(models.SensorReading.recorded_at.asc()).all()


def _check_thresholds(reading: models.SensorReading, user: models.User, db: Session) -> None:
    """After each ingested reading, check user-defined alert rules and create a notification if breached."""
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
