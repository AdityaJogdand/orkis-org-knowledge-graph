"""
Seed script: inserts the 4 roles and creates the Associate Dean user.
Run from the repo root:
    python -m backend.scripts.seed

Idempotent: safe to run multiple times. Only prints the password on first run.
"""

import sys

from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import SessionLocal
from backend.models import Role, RefreshToken, User, UserRole
from backend.auth.service import hash_password


ROLES = [
    ("associate_dean", "Associate Dean"),
    ("programme_chair", "Programme Chairperson"),
    ("faculty", "Faculty"),
    ("student", "Student"),
]


def _password_from_email(email: str) -> str:
    """Derive password from name.surname@domain → Name@Surname123"""
    local = email.split("@")[0]          # e.g. "preeti.gupta"
    parts = local.split(".")
    if len(parts) >= 2:
        name, surname = parts[0].capitalize(), parts[1].capitalize()
    else:
        name, surname = parts[0].capitalize(), "User"
    return f"{name}@{surname}123"


def seed(db: Session) -> None:
    # 1. Insert roles (idempotent)
    for code, label in ROLES:
        if not db.query(Role).filter_by(code=code).first():
            db.add(Role(code=code, label=label))
    db.commit()

    # 2. Check if dean already exists
    dean_email = settings.dean_email.lower()
    existing = db.query(User).filter_by(email=dean_email).first()
    if existing:
        print(f"\nAssociate Dean '{dean_email}' already exists — password unchanged.\n")
        return

    # 3. Derive password from email (name.surname@domain → Name@Surname123)
    plain_password = _password_from_email(dean_email)
    hashed = hash_password(plain_password)

    # 4. Create user
    dean = User(
        email=dean_email,
        password_hash=hashed,
        full_name="Associate Dean",
        is_active=True,
    )
    db.add(dean)
    db.flush()  # get dean.id before commit

    # 5. Assign role
    role = db.query(Role).filter_by(code="associate_dean").first()
    db.add(UserRole(user_id=dean.id, role_id=role.id))
    db.commit()

    # 6. Print credentials once — this is the ONLY time the plaintext appears
    print()
    print("=" * 60)
    print("  ASSOCIATE DEAN — FIRST-TIME LOGIN")
    print(f"  email:    {dean_email}")
    print(f"  password: {plain_password}")
    print("  NOTE: shown once. Change it after first login.")
    print("=" * 60)
    print()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()
