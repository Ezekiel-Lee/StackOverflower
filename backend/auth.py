"""
Firebase Auth integration.

The mobile app signs users in directly with the Firebase Auth SDK (email/
password, Google, etc. -- whatever the client team wants) and gets back a
Firebase ID token. Every authenticated request to this API sends that token
as `Authorization: Bearer <id_token>`. This module verifies the token with
the Firebase Admin SDK and resolves it to a local `User` row.

Setup required (see README):
1. Create a Firebase project, enable an Auth sign-in method (e.g. Email/Password).
2. Generate a service account key (Project Settings -> Service Accounts ->
   Generate new private key) and save it as `firebase-service-account.json`
   in the project root (gitignored -- never commit this file).
3. Set FIREBASE_CREDENTIALS_PATH if you keep it somewhere else.
"""
import os

import firebase_admin
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth, credentials
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


class Bearer401(HTTPBearer):
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )


http_bearer = Bearer401()

_CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")

if not firebase_admin._apps:
    if os.path.exists(_CRED_PATH):
        firebase_admin.initialize_app(credentials.Certificate(_CRED_PATH))
    else:
        print(f"[auth] Firebase service account not found at {_CRED_PATH} -- "
              f"auth-protected routes will fail until it's added.")


def verify_firebase_token(id_token: str) -> dict:
    try:
        return firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    claims = verify_firebase_token(credentials.credentials)
    firebase_uid = claims["uid"]

    user = db.query(models.User).filter(models.User.id == firebase_uid).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found locally -- call POST /auth/sync after first sign-in",
        )
    return user