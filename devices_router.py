from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/devices", tags=["devices"])


def _get_owned_device(device_id: str, current_user: models.User, db: Session) -> models.Device:
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device or device.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("", response_model=schemas.DeviceOut, status_code=201)
def register_device(
    payload: schemas.DeviceCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    device = models.Device(owner_id=current_user.id, **payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("", response_model=List[schemas.DeviceOut])
def list_devices(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Device).filter(models.Device.owner_id == current_user.id).all()


@router.patch("/{device_id}", response_model=schemas.DeviceOut)
def rename_device(
    device_id: str,
    payload: schemas.DeviceUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    device = _get_owned_device(device_id, current_user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=204)
def remove_device(
    device_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    device = _get_owned_device(device_id, current_user, db)
    db.delete(device)
    db.commit()
