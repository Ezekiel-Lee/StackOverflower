from typing import List

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(tags=["alerts"])


@router.post("/alert-rules", response_model=schemas.AlertRuleOut, status_code=201)
def create_alert_rule(
    payload: schemas.AlertRuleCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    rule = models.AlertRule(user_id=current_user.id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/alert-rules", response_model=List[schemas.AlertRuleOut])
def list_alert_rules(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.AlertRule).filter(models.AlertRule.user_id == current_user.id).all()


@router.get("/notifications", response_model=List[schemas.NotificationOut])
def list_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


@router.patch("/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notification_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Marks a notification as read (sets read_at to now). Idempotent -- calling
    this on an already-read notification just refreshes read_at rather than
    erroring, since the mobile app doesn't need to track whether this is the
    first read.
    """
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == current_user.id,
        )
        .first()
    )
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read_at = datetime.utcnow()
    db.commit()
    db.refresh(notification)
    return notification
