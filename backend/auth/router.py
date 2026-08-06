from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session  # noqa: F401 — used by Depends

import re

from ..database import get_db
from ..models import FacultyMember, Programme, UserLogin
from . import service
from .dependencies import get_current_user
from .schemas import ChangePasswordIn, LoginIn, RefreshIn, TokenPairOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPairOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = service.get_user_by_email(data.email, db)
    if not user or not service.verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
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
def me(current_user: UserLogin = Depends(get_current_user), db: Session = Depends(get_db)):
    faculty = db.query(FacultyMember).filter(FacultyMember.user_login_id == current_user.id).first()

    title = ""
    chaired_programme = ""

    if faculty:
        m = re.match(r"^(Dr\.|Prof\.)\s", faculty.full_name)
        if m:
            title = m.group(1)
        if faculty.chaired_programme_id:
            prog = db.get(Programme, faculty.chaired_programme_id)
            if prog:
                chaired_programme = prog.name

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        title=title,
        chaired_programme=chaired_programme,
    )


@router.post("/change-password")
def change_password(
    data: ChangePasswordIn,
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not service.verify_password(data.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect"
        )
    if len(data.new_password) < 8 or data.new_password.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and not all numeric",
        )
    current_user.password = service.hash_password(data.new_password)
    db.commit()
    return {"detail": "Password updated"}
