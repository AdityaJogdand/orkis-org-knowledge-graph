"""
Seed workload data from Workload.csv into programmes, subjects, faculty_workload tables.
Run from the repo root:
    python -m backend.scripts.seed_workload

Idempotent: clears and re-seeds workload data on each run.
"""

import csv
import re
import sys
from pathlib import Path

from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import FacultyWorkload, Programme, Subject, UserLogin


CSV_PATH = Path(__file__).resolve().parent.parent.parent / "Workload.csv"
ACADEMIC_YEAR = "2024-25"

# Canonical programme definitions
PROGRAMMES = [
    {"name": "MBA Tech",      "code": "MBA_TECH"},
    {"name": "B.Tech CE",     "code": "BTECH_CE"},
    {"name": "B.Tech AI&DS",  "code": "BTECH_AIDS"},
]

# Roman numeral → integer
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
         "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}

# Skip these rows
SKIP_PATTERNS = [
    r"^faculty name$", r"^total$", r"^community service$",
    r"^department elective", r"^open elective", r"^program elective",
    r"^specialization", r"^electives", r"^design experience",
    r"^technical internship$", r"^management internship",
    r"^capstone project$",
]


def _is_skip(text: str) -> bool:
    t = text.strip().lower()
    return not t or any(re.match(p, t) for p in SKIP_PATTERNS)


def _parse_semester_header(text: str) -> tuple[str, int, str | None] | None:
    """
    Returns (programme_code, semester_number, division) or None if not a header.
    Examples:
      'Semester- I (MBA Tech)'                 → ('MBA_TECH', 1, None)
      'Semester- I (B. Tech CE) (A)'           → ('BTECH_CE', 1, 'A')
      'Semester III (B Tech CE) (Div - A)'     → ('BTECH_CE', 3, 'A')
      'Semester V (B Tech AI & DS)'            → ('BTECH_AIDS', 5, None)
    """
    text = text.strip()
    if not re.match(r"^semester", text, re.IGNORECASE):
        return None

    # Extract semester roman numeral
    sem_match = re.search(r"semester[-\s]+([IVX]+)", text, re.IGNORECASE)
    if not sem_match:
        return None
    roman = sem_match.group(1).upper()
    sem_num = ROMAN.get(roman)
    if not sem_num:
        return None

    # Extract division
    div_match = re.search(r"\((?:Div\s*[-–]\s*)?([AB])\)", text, re.IGNORECASE)
    division = div_match.group(1).upper() if div_match else None

    # Determine programme
    t = text.upper()
    if "AI" in t and ("DS" in t or "AIDS" in t):
        prog_code = "BTECH_AIDS"
    elif "B" in t and ("TECH" in t or "B.TECH" in t) and "CE" in t:
        prog_code = "BTECH_CE"
    elif "MBA" in t:
        prog_code = "MBA_TECH"
    else:
        return None

    return prog_code, sem_num, division


def _clean_faculty_name(raw: str) -> str:
    return raw.strip().strip('"').strip()


def _match_user(faculty_name: str, users: list[UserLogin]) -> UserLogin | None:
    """Match faculty name to a user_login row by comparing name parts to email."""
    clean = re.sub(r'\b(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*', '', faculty_name, flags=re.IGNORECASE).strip()
    clean_lower = clean.lower()
    for user in users:
        local = user.email.split("@")[0]          # e.g. "ranjit.dhunde"
        parts = local.split(".")
        if len(parts) >= 2:
            first, last = parts[0].lower(), parts[1].lower()
            if first in clean_lower and last in clean_lower:
                return user
    return None


def _determine_category(text: str, current_category: str) -> str:
    t = text.strip().lower()
    if "department elective" in t:
        return "Department Elective"
    if "open elective" in t:
        return "Open Elective"
    if "program elective" in t:
        return "Programme Elective"
    return current_category


def seed(db: Session) -> None:
    # ── 1. Ensure programmes exist ────────────────────────────────────────────
    prog_map: dict[str, Programme] = {}
    for p in PROGRAMMES:
        existing = db.query(Programme).filter_by(code=p["code"]).first()
        if not existing:
            existing = Programme(name=p["name"], code=p["code"])
            db.add(existing)
            db.flush()
        prog_map[p["code"]] = existing
    db.commit()
    print(f"  Programmes ready: {list(prog_map.keys())}")

    # ── 2. Clear existing workload data ───────────────────────────────────────
    db.query(FacultyWorkload).delete()
    db.query(Subject).delete()
    db.commit()
    print("  Cleared existing subjects and workload.")

    # ── 3. Load all users for matching ───────────────────────────────────────
    users = db.query(UserLogin).all()

    # ── 4. Parse CSV ──────────────────────────────────────────────────────────
    if not CSV_PATH.exists():
        print(f"ERROR: CSV not found at {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    current_prog_code: str | None = None
    current_sem: int | None = None
    current_div: str | None = None
    current_category = "Core"

    subject_count = 0
    workload_count = 0
    matched_count = 0

    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        for row in reader:
            # Pad row to at least 4 columns
            while len(row) < 4:
                row.append("")

            col1 = row[1].strip()  # subject or section header
            col2 = row[2].strip()  # faculty name
            col3 = row[3].strip()  # Core / Visiting

            if not col1:
                continue

            # Check if it's a semester section header
            header = _parse_semester_header(col1)
            if header:
                current_prog_code, current_sem, current_div = header
                current_category = "Core"
                continue

            # Skip non-data rows
            if _is_skip(col1):
                current_category = _determine_category(col1, current_category)
                continue

            # Skip rows with no faculty and no data
            if not col2 and not col3:
                continue

            if current_prog_code is None or current_sem is None:
                continue

            # Get programme
            programme = prog_map[current_prog_code]

            # ── Subject ──────────────────────────────────────────────────────
            subject_name = col1.strip()
            subject = Subject(
                programme_id=programme.id,
                name=subject_name,
                semester_number=current_sem,
                category=current_category,
            )
            db.add(subject)
            db.flush()
            subject_count += 1

            # ── Faculty (handle multiple: "Dr. X & Dr. Y") ──────────────────
            if not col2:
                continue

            faculty_entries = re.split(r"\s*&\s*", col2)
            faculty_type = col3 if col3 else "Core"

            for raw_name in faculty_entries:
                raw_name = _clean_faculty_name(raw_name)
                if not raw_name:
                    continue

                matched_user = _match_user(raw_name, users)
                if matched_user:
                    matched_count += 1

                workload = FacultyWorkload(
                    subject_id=subject.id,
                    user_login_id=matched_user.id if matched_user else None,
                    faculty_name=raw_name,
                    faculty_type=faculty_type.split("/")[0].strip(),  # take first if "Core/Visiting"
                    division=current_div,
                    academic_year=ACADEMIC_YEAR,
                )
                db.add(workload)
                workload_count += 1

    db.commit()

    print(f"  Subjects inserted  : {subject_count}")
    print(f"  Workload entries   : {workload_count}")
    print(f"  Matched to users   : {matched_count} / {workload_count}")
    print(f"  Visiting / unlinked: {workload_count - matched_count}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        print()
        print("=" * 60)
        print("  SEEDING WORKLOAD DATA")
        print("=" * 60)
        seed(db)
        print("=" * 60)
        print("  Done.")
        print("=" * 60)
        print()
    except Exception as exc:
        import traceback
        traceback.print_exc()
        print(f"Seed failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()
