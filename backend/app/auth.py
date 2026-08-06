"""
Firebase Auth integration.

The mobile app signs users in directly with the Firebase Auth SDK (email/
password, Google, etc. — whatever the client team wants) and gets back a
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
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth, credentials
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

http_bearer = HTTPBearer()

_CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")

if not firebase_admin._apps:
    if os.path.exists(_CRED_PATH):
        firebase_admin.initialize_app(credentials.Certificate(_CRED_PATH))
    else:
        # Lets the app boot (e.g. for non-auth routes, or CI) even without
        # the service account file present; any call that actually verifies
        # a token will fail clearly instead of at import time.
        print(f"[auth] Firebase service account not found at {_CRED_PATH} -- "
              f"auth-protected routes will fail until it's added.")


def verify_firebase_token(id_token: str) -> dict:
    """Verifies a Firebase ID token and returns its decoded claims (uid, email, ...)."""
    try:
        return firebase_auth.verify_id_token(id_token)
    except Exception as exc:  # firebase_admin raises several distinct exception types
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Resolves the bearer token to a local User row.

    Requires the user to already exist locally (created via POST
    /auth/sync on first sign-in) -- this dependency does NOT create users,
    it just verifies + looks up, keeping the "who is this" and "make sure
    they're in our DB" concerns separate.
    """
    claims = verify_firebase_token(credentials.credentials)
    firebase_uid = claims["uid"]

    user = db.query(models.User).filter(models.User.id == firebase_uid).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found locally -- call POST /auth/sync after first sign-in",
        )
    return user
