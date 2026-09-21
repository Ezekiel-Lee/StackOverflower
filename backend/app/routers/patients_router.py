from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/patients", tags=["patients"])

# All routes below require the caller to be signed in AND have role="doctor"
# (see auth.require_doctor). This is the one deliberate exception to the
# "you can only ever see your own data" rule the rest of the API enforces --
# keeping it in its own router/prefix makes that exception easy to find and
# easy to review.


@router.get("/search", response_model=List[schemas.PatientSummary])
def search_patients(
    query: str = Query(..., min_length=1, description="Matches name or patient_code"),
    _doctor: models.User = Depends(auth.require_doctor),
    db: Session = Depends(get_db),
):
    """Matches the wireframe's 'Find Patient Details' search -- by name or patient ID."""
    like = f"%{query}%"
    return (
        db.query(models.User)
        .filter(
            models.User.role == "patient",
            or_(models.User.name.ilike(like), models.User.patient_code.ilike(like)),
        )
        .order_by(models.User.name)
        .limit(50)
        .all()
    )


@router.get("/{patient_id}", response_model=schemas.PatientOut)
def get_patient(
    patient_id: str,
    _doctor: models.User = Depends(auth.require_doctor),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(models.User)
        .filter(models.User.id == patient_id, models.User.role == "patient")
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=schemas.PatientOut)
def update_patient(
    patient_id: str,
    payload: schemas.PatientUpdate,
    _doctor: models.User = Depends(auth.require_doctor),
    db: Session = Depends(get_db),
):
    """Matches the wireframe's 'Edit Details' -> confirm -> 'Saved successfully' flow."""
    patient = (
        db.query(models.User)
        .filter(models.User.id == patient_id, models.User.role == "patient")
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient
