from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from . import service
from .dependencies import get_current_user
from .email import send_otp_email
from .schemas import (
    ChangePasswordIn,
    LoginIn,
    OtpRequestIn,
    OtpVerifyIn,
    RefreshIn,
    TokenPairOut,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPairOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = service.get_user_by_email(data.email, db)
    if not user or not service.verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled"
        )
    return TokenPairOut(
        access_token=service.create_access_token(user),
        refresh_token=service.issue_refresh_token(user, db),
    )


@router.post("/refresh", response_model=TokenPairOut)
def refresh(data: RefreshIn, db: Session = Depends(get_db)):
    result = service.rotate_refresh_token(data.refresh_token, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    user, new_refresh = result
    return TokenPairOut(
        access_token=service.create_access_token(user),
        refresh_token=new_refresh,
    )


@router.post("/logout")
def logout(data: RefreshIn, db: Session = Depends(get_db)):
    service.revoke_refresh_token(data.refresh_token, db)
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        roles=[r.code for r in current_user.roles],
        is_active=current_user.is_active,
    )


@router.post("/otp/request", status_code=status.HTTP_202_ACCEPTED)
def otp_request(data: OtpRequestIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Step 1 — request an OTP for the given email.

    Always returns 202 (so callers cannot enumerate registered emails).
    Email is sent in the background so the response returns immediately.
    """
    user = service.get_user_by_email(data.email, db)
    if user and user.is_active:
        code = service.generate_and_store_otp(user, db)
        background_tasks.add_task(send_otp_email, user.email, user.full_name, code)
    return {"detail": "If that email is registered, an OTP has been sent."}


@router.post("/otp/verify", response_model=TokenPairOut)
def otp_verify(data: OtpVerifyIn, db: Session = Depends(get_db)):
    """Step 2 — submit email + OTP to receive a token pair."""
    user = service.verify_and_consume_otp(data.email, data.otp, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled"
        )
    return TokenPairOut(
        access_token=service.create_access_token(user),
        refresh_token=service.issue_refresh_token(user, db),
    )


@router.post("/change-password")
def change_password(
    data: ChangePasswordIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not service.verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect"
        )
    if len(data.new_password) < 8 or data.new_password.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and not all numeric",
        )
    current_user.password_hash = service.hash_password(data.new_password)
    service.revoke_all_refresh_tokens(current_user.id, db)
    db.commit()
    return {"detail": "Password updated"}
