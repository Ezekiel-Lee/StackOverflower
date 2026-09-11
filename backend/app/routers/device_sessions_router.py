from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.routers.devices_router import _get_owned_device

router = APIRouter(prefix="/devices/{device_id}/sessions", tags=["device-sessions"])


@router.post("", response_model=schemas.DeviceSessionOut, status_code=201)
def start_session(
    device_id: str,
    payload: schemas.DeviceSessionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Records that a device connected. Call this when the mobile app
    establishes a BLE connection (or, once the normalizer/vendor-API
    approach lands, when a sync cycle starts) so connection history is
    visible for debugging drop patterns.
    """
    _get_owned_device(device_id, current_user, db)

    session = models.DeviceSession(
        device_id=device_id,
        connected_at=payload.connected_at or datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/{session_id}", response_model=schemas.DeviceSessionOut)
def end_session(
    device_id: str,
    session_id: str,
    payload: schemas.DeviceSessionUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Closes out a session once the device disconnects (or a sync cycle ends)."""
    _get_owned_device(device_id, current_user, db)

    session = (
        db.query(models.DeviceSession)
        .filter(
            models.DeviceSession.id == session_id,
            models.DeviceSession.device_id == device_id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    if session.disconnected_at is None and payload.disconnected_at is None:
        session.disconnected_at = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=List[schemas.DeviceSessionOut])
def list_sessions(
    device_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Connection history for a device, most recent first."""
    _get_owned_device(device_id, current_user, db)

    return (
        db.query(models.DeviceSession)
        .filter(models.DeviceSession.device_id == device_id)
        .order_by(models.DeviceSession.connected_at.desc())
        .all()
    )
