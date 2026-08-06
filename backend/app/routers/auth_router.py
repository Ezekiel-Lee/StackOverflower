from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=schemas.UserOut)
def sync_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth.http_bearer),
    db: Session = Depends(get_db),
):
    """
    Call this once right after the mobile app signs a user in with the
    Firebase SDK (first sign-in, or any time the app wants to make sure the
    local mirror is up to date). Verifies the Firebase ID token and
    creates/updates the matching local `users` row.

    Every other endpoint's `Depends(auth.get_current_user)` assumes this
    row already exists -- it looks the user up, it doesn't create them.
    """
    claims = auth.verify_firebase_token(credentials.credentials)
    firebase_uid = claims["uid"]
    email = claims.get("email", "")
    name = claims.get("name", email or firebase_uid)

    user = db.query(models.User).filter(models.User.id == firebase_uid).first()
    if user is None:
        user = models.User(id=firebase_uid, email=email, name=name)
        db.add(user)
    else:
        user.email = email or user.email
        user.name = name or user.name

    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
