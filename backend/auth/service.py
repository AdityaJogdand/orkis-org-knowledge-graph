import hashlib
import random
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
from jose import jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import OtpCode, RefreshToken, User


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "roles": [r.code for r in user.roles],
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def issue_refresh_token(user: User, db: Session) -> str:
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


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def get_user_by_email(email: str, db: Session) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(user_id: str, db: Session) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def rotate_refresh_token(raw_token: str, db: Session) -> tuple[User, str] | None:
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
    user = db.query(User).filter(User.id == record.user_id).first()
    new_raw = issue_refresh_token(user, db)
    return user, new_raw


def revoke_refresh_token(raw_token: str, db: Session) -> None:
    h = _hash_token(raw_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == h).first()
    if record:
        record.revoked = True
        db.commit()


def revoke_all_refresh_tokens(user_id, db: Session) -> None:
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id, RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()


# ─── OTP helpers ─────────────────────────────────────────────────────────────

def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_and_store_otp(user: User, db: Session) -> str:
    """Generate a 6-digit OTP, invalidate any prior unused OTPs, persist, and return the raw code."""
    # Invalidate all unexpired, unused OTPs for this user
    db.query(OtpCode).filter(
        OtpCode.user_id == user.id,
        OtpCode.used == False,
        OtpCode.expires_at > datetime.now(timezone.utc),
    ).update({"used": True})

    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    record = OtpCode(
        id=uuid4(),
        user_id=user.id,
        code_hash=_hash_otp(code),
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=settings.otp_expire_minutes),
    )
    db.add(record)
    db.commit()
    return code


def verify_and_consume_otp(email: str, code: str, db: Session) -> User | None:
    """Return the User if the OTP is valid and not yet used, else None."""
    user = get_user_by_email(email, db)
    if not user:
        return None

    record = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user.id,
            OtpCode.code_hash == _hash_otp(code),
            OtpCode.used == False,
            OtpCode.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not record:
        return None

    record.used = True
    db.commit()
    return user
