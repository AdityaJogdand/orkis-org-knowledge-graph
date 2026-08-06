"""
Reset all user passwords to a single value.
Run from repo root:
    python -m backend.scripts.reset_passwords
"""

from backend.database import SessionLocal
from backend.models import UserLogin
from backend.auth.service import hash_password

NEW_PASSWORD = "Nmims@orkis"


def reset(db):
    users = db.query(UserLogin).all()
    hashed = hash_password(NEW_PASSWORD)
    for user in users:
        user.password = hashed
    db.commit()
    print(f"  Updated {len(users)} user(s) → password set to '{NEW_PASSWORD}'")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("\n" + "=" * 50)
        print("  RESETTING ALL PASSWORDS")
        print("=" * 50)
        reset(db)
        print("=" * 50 + "\n")
    finally:
        db.close()
