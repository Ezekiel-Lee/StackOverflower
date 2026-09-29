from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.services import get_owned_device as _get_owned_device
from app.normalizer import service as normalizer_service
from app.normalizer.base import VendorAuthError
from app.normalizer.registry import get_adapter

router = APIRouter(prefix="/devices", tags=["devices"])


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


@router.post("/{device_id}/link-vendor", response_model=schemas.DeviceOut)
def link_vendor(
    device_id: str,
    payload: schemas.VendorLinkRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stores the OAuth credential the mobile app obtained from the wearable
    vendor's sign-in flow, and marks this device as belonging to that
    vendor. Call this once, right after the app's "vendor connected
    successfully" step (see the wireframe) -- after that, POST
    /devices/{id}/sync can pull readings.
    """
    device = _get_owned_device(device_id, current_user, db)

    # Fail fast on a typo'd/unsupported vendor key rather than silently
    # storing a credential that sync_device() can never use.
    try:
        get_adapter(payload.vendor)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    device.vendor = payload.vendor
    device.vendor_device_id = payload.vendor_device_id

    if device.credential is None:
        device.credential = models.VendorCredential(device_id=device.id, access_token=payload.access_token)
    device.credential.access_token = payload.access_token
    device.credential.refresh_token = payload.refresh_token
    device.credential.expires_at = payload.expires_at

    db.commit()
    db.refresh(device)
    return device


@router.post("/{device_id}/sync", response_model=schemas.SyncResult)
def sync_device(
    device_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pulls new readings for this device through the normalizer (see
    app/normalizer/service.py) and feeds them into the same ingestion +
    alert-rule pipeline as a manual POST /devices/{id}/data call.
    """
    device = _get_owned_device(device_id, current_user, db)

    try:
        count = normalizer_service.sync_device(device, db)
    except normalizer_service.DeviceNotLinkedError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except VendorAuthError as exc:
        raise HTTPException(status_code=401, detail=f"Vendor authentication failed: {exc}")

    return schemas.SyncResult(
        readings_synced=count,
        battery_level=device.battery_level,
        last_synced_at=device.last_synced_at,
    )
