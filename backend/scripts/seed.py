"""
Seed script: populates the user_login table with default accounts.
Run from the repo root:
    python -m backend.scripts.seed

Idempotent: safe to run multiple times. Skips users that already exist.

Default password for all accounts: Nmims@orkis
"""

import sys

import bcrypt
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import SessionLocal
from backend.models import UserLogin


DEFAULT_PASSWORD = "Nmims@orkis"


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    return bcrypt.hashpw(password.encode(), salt).decode()


# (email, role)
SEED_USERS = [
    ("preeti.gupta@nmims.edu",       "Associate Professor and Associate Dean"),
    ("shailendra.aote@nmims.edu",    "Associate Professor and Program Chairperson"),
    ("asha.rawat@nmims.edu",         "Assistant Professor and Program Chairperson"),
    ("divyang.jadav@nmims.edu",      "Assistant Professor and Program Chairperson"),
    ("aparna.rao@nmims.edu",         "Associate Professor"),
    ("aditya.kasar@nmims.edu",       "Assistant Professor"),
    ("tejaswini.chavan@nmims.edu",   "Assistant Professor"),
    ("jyoti.verma@nmims.edu",        "Assistant Professor"),
    ("variza.negi@nmims.edu",        "Assistant Professor"),
    ("toral.shah@nmims.edu",         "Assistant Professor"),
    ("ranjit.dhunde@nmims.edu",      "Assistant Professor"),
    ("sakshi.indolia@nmims.edu",     "Assistant Professor"),
    ("pratiksha.patil@nmims.edu",    "Assistant Professor"),
    ("preeti.agarwal@nmims.edu",     "Assistant Professor"),
    ("padmashri.patil@nmims.edu",    "Assistant Professor"),
    ("madhura.vyawahare@nmims.edu",  "Assistant Professor"),
    ("archana.gulati@nmims.edu",     "Assistant Professor"),
    ("chhaya.dhavale@nmims.edu",     "Assistant Professor"),
    ("snehal.lohi@nmims.edu",        "Assistant Professor"),
    ("swati.vaishnav@nmims.edu",     "Assistant Professor"),
    ("sulochana.devi@nmims.edu",     "Assistant Professor"),
    ("namrata.singh@nmims.edu",      "Assistant Professor"),
]


def seed(db: Session) -> None:
    hashed = hash_password(DEFAULT_PASSWORD)

    print()
    print("=" * 60)
    print("  SEEDING USER_LOGIN")
    print("=" * 60)

    for email, role in SEED_USERS:
        if db.query(UserLogin).filter_by(email=email).first():
            print(f"  SKIP   {email} (already exists)")
            continue
        db.add(UserLogin(email=email, password=hashed, role=role))
        db.commit()
        print(f"  CREATE {email}  |  role: {role}")

    print("=" * 60)
    print(f"  Default password: {DEFAULT_PASSWORD}")
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
