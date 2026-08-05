from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
from jose import jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import RefreshToken, UserLogin


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(user: UserLogin) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def issue_refresh_token(user: UserLogin, db: Session) -> str:
    raw = secrets.token_urlsafe(32)
    record = RefreshToken(
        id=uuid4(),
        user_id=user.id,
        token_hash=_hash_token(raw),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(record)
    db.commit()
    return raw


def rotate_refresh_token(raw_token: str, db: Session) -> tuple[UserLogin, str] | None:
    h = _hash_token(raw_token)
    record = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == h,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not record:
        return None
    record.revoked = True
    db.commit()
    user = db.query(UserLogin).filter(UserLogin.id == record.user_id).first()
    new_raw = issue_refresh_token(user, db)
    return user, new_raw


def revoke_refresh_token(raw_token: str, db: Session) -> None:
    h = _hash_token(raw_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == h).first()
    if record:
        record.revoked = True
        db.commit()


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def get_user_by_email(email: str, db: Session) -> UserLogin | None:
    return db.query(UserLogin).filter(UserLogin.email == email.lower()).first()


def get_user_by_id(user_id: str, db: Session) -> UserLogin | None:
    return db.query(UserLogin).filter(UserLogin.id == user_id).first()
