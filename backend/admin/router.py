from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth.dependencies import require_role
from ..auth.service import hash_password
from ..database import get_db
from ..models import Role, User, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])


VALID_ROLES = {"associate_dean", "programme_chair", "faculty", "student"}


class ProvisionUserIn(BaseModel):
    email: str
    full_name: str
    role: str
    password: str | None = None  # auto-generated if omitted


class ProvisionUserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    password: str | None  # returned only on creation, None if caller supplied one


def _default_password(email: str) -> str:
    """Derive a readable default: name.surname@domain → Name@Surname123"""
    local = email.split("@")[0]
    parts = local.split(".")
    name = parts[0].capitalize()
    suffix = parts[1].capitalize() if len(parts) > 1 else "User"
    return f"{name}@{suffix}123"


@router.post("/users", response_model=ProvisionUserOut,
             status_code=status.HTTP_201_CREATED)
def provision_user(
    data: ProvisionUserIn,
    _: User = Depends(require_role("associate_dean")),
    db: Session = Depends(get_db),
):
    """Create a new institutional user. Requires Associate Dean token."""
    if data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Choose from: {', '.join(sorted(VALID_ROLES))}",
        )

    email = data.email.lower().strip()
    if db.query(User).filter_by(email=email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{email}' already exists.",
        )

    plain_password = data.password or _default_password(email)

    user = User(
        email=email,
        password_hash=hash_password(plain_password),
        full_name=data.full_name.strip(),
        is_active=True,
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter_by(code=data.role).first()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.commit()
    db.refresh(user)

    return ProvisionUserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=data.role,
        password=None if data.password else plain_password,
    )


@router.get("/users")
def list_users(
    _: User = Depends(require_role("associate_dean")),
    db: Session = Depends(get_db),
):
    """List all users. Requires Associate Dean token."""
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "roles": [r.code for r in u.roles],
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    _: User = Depends(require_role("associate_dean")),
    db: Session = Depends(get_db),
):
    """Disable a user account without deleting it. Requires Associate Dean token."""
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = False
    db.commit()
    return {"detail": f"User '{user.email}' has been deactivated."}
