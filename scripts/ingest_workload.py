"""
Ingest Workload.xlsx into Supabase.

Strategy — additive, never duplicate:
  1. Parse every subject row, grouped by programme/semester/division.
  2. Normalise the subject name and look it up in the subjects table.
  3. INSERT subjects that don't exist yet (Capstone Project, Community Service,
     Technical Internship, MBA Sem-9 specialisation electives, …).
  4. INSERT faculty_workload rows that don't already exist
     (matched on subject_id + normalised faculty name + division).
  5. Skip pure category-header rows (Department Elective I, Open Electives, etc.)
     that carry no faculty assignment of their own.

Run from the project root:
    python3 scripts/ingest_workload.py
"""

import re
import uuid
import psycopg2
import openpyxl
from pathlib import Path

# ─── Config ─────────────────────────────────────────────────────────────────────
DB_URL    = "postgresql://postgres:8591282986110418@db.nnbveokfgsbcnrnzziny.supabase.co:5432/postgres"
XLSX_PATH = Path(__file__).parent.parent / "Workload.xlsx"
ACADEMIC_YEAR = "2026-27"

# ─── Section-header → (programme_code, semester, division) ─────────────────────
def parse_section_header(text: str) -> tuple | None:
    t = text.strip()

    sem_map = {"I": 1, "III": 3, "V": 5, "VII": 7, "IX": 9,
               "1": 1, "3": 3, "5": 5, "7": 7, "9": 9}

    # Extract roman numeral / arabic semester
    sem_m = re.search(r"Semester[-\s]*(IX|VII|III|I|V|\d+)", t, re.IGNORECASE)
    if not sem_m:
        return None
    sem_raw = sem_m.group(1).upper()
    sem = sem_map.get(sem_raw)
    if sem is None:
        return None

    tl = t.lower()
    if "mba" in tl:
        return ("MBA_TECH", sem, None)
    if "ai" in tl and "ds" in tl:
        return ("BTECH_AIDS", sem, None)
    if "b. tech ce" in tl or "b tech ce" in tl:
        if "(a)" in tl or "div - a" in tl or "div-a" in tl:
            return ("BTECH_CE", sem, "A")
        if "(b)" in tl or "div - b" in tl or "div-b" in tl:
            return ("BTECH_CE", sem, "B")
        return ("BTECH_CE", sem, None)
    return None


# ─── Pure category-header rows (no real subject / no faculty intended) ──────────
SKIP_SUBJECTS = {
    "total", "community service",
    "technical internship", "capstone project",
    "management internship program", "design experience 2",
    "department elective i", "department elective ii",
    "department elective iii", "department elective iv",
    "department elective v", "department elective vi",
    "department elective 1 (de1) & department elective 2 (de2)",
    "department elective 5 (de5) & department elective 6 (de6)",
    "open electives 1 (oe1)", "open electives 2 (oe2)", "open elective v",
    "program elective 1 (choose any one)",
    "electives: (any 4)",
    "specialization: finance", "specialization: marketing",
    "specialization: business intelligence and analytics",
}

# Subjects that have no faculty but should still be added to subjects table
ADD_AS_SUBJECT_NO_FACULTY = {
    "community service",
    "technical internship",
    "capstone project",
    "management internship program",
    "design experience 2",
}

# Category for non-taught programme activities
ACTIVITY_SUBJECTS = {
    "community service", "technical internship", "capstone project",
    "management internship program", "design experience 2",
}


def is_category_header(text: str) -> bool:
    t = text.strip().lower()
    # catch "Department Elective X", "Open Electives Y", "Specialization: …"
    if re.match(r"department elective\s*(i{1,4}|v?i{0,3}|\d)", t):
        return True
    if re.match(r"open elective", t):
        return True
    if re.match(r"program(me)? elective", t):
        return True
    if t.startswith("electives:"):
        return True
    if t.startswith("specialization:"):
        return True
    if t in ("total",):
        return True
    return False


def normalise_subject(name: str) -> str:
    """Strip trailing batch qualifiers and whitespace; fix known typos."""
    n = name.strip()
    n = re.sub(r"\s+B[12]\s*&\s*B[12]\s*$", "", n)
    n = re.sub(r"\s+B[12]\s*$", "", n)
    n = n.replace("Enviromental", "Environmental")
    n = n.strip()
    return n


def normalise_faculty(name: str) -> str:
    """Light normalisation for dedup — lowercase, collapse spaces."""
    return re.sub(r"\s+", " ", name.strip().lower())


def infer_category(subj_name: str, raw_name: str) -> str:
    sn = subj_name.lower()
    if sn in ACTIVITY_SUBJECTS:
        return "Programme Activity"
    # Detect from section-level context or name
    if re.match(r"(investment|mergers|financial|marketing strategy|marketing of|"
                r"marketing analytics|data visualization for)", sn):
        return "Specialisation Elective"
    return "Core"     # default; caller may override


# ─── Parse Workload.xlsx ────────────────────────────────────────────────────────

def parse_workload(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(str(path), data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))

    records = []
    current_section = None   # (prog_code, sem, division)

    for row in rows:
        cell_b = row[1] if len(row) > 1 else None   # col B = subject / header
        cell_c = row[2] if len(row) > 2 else None   # col C = faculty name
        cell_d = row[3] if len(row) > 3 else None   # col D = Core/Visiting

        if not cell_b:
            continue

        text = str(cell_b).strip()

        # Try parsing as section header first
        section = parse_section_header(text)
        if section:
            current_section = section
            continue

        if current_section is None:
            continue

        # Skip pure category headers (no actual subject)
        if is_category_header(text):
            continue

        # Real subject row
        subj_norm = normalise_subject(text)
        faculty_raw = str(cell_c).strip() if cell_c else None
        ftype_raw   = str(cell_d).strip() if cell_d else None

        # Map faculty_type
        if ftype_raw:
            fl = ftype_raw.lower()
            if "visiting" in fl and "core" in fl:
                # "Core/visiting" — store as two separate rows later
                ftype = "Mixed"
            elif "visiting" in fl:
                ftype = "Visiting"
            else:
                ftype = "Core"
        else:
            ftype = None  # unknown

        records.append({
            "prog_code": current_section[0],
            "sem":       current_section[1],
            "division":  current_section[2],
            "subj_norm": subj_norm,
            "faculty_raw": faculty_raw,
            "ftype":     ftype,
        })

    return records


# ─── Main ingestion ─────────────────────────────────────────────────────────────

def main():
    print("Parsing Workload.xlsx …")
    records = parse_workload(XLSX_PATH)
    print(f"  Parsed {len(records)} subject rows")

    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    # Load programme map
    cur.execute("SELECT code, id FROM programmes")
    prog_map = {r[0]: r[1] for r in cur.fetchall()}

    # Load existing subjects → {(prog_id, sem, lower_name): (subject_id, category)}
    cur.execute("SELECT id, programme_id, semester_number, name, category FROM subjects")
    subj_db: dict[tuple, tuple] = {}
    for sid, pid, sem, name, cat in cur.fetchall():
        subj_db[(str(pid), sem, name.lower())] = (str(sid), cat)

    # Load existing faculty_workload → set of (subject_id, lower_faculty_name, division)
    cur.execute("SELECT subject_id, faculty_name, division FROM faculty_workload")
    existing_wl: set[tuple] = set()
    for sid, fname, div in cur.fetchall():
        existing_wl.add((str(sid), normalise_faculty(fname), div))

    subjects_added   = 0
    workloads_added  = 0
    skipped_existing = 0

    for rec in records:
        prog_id = prog_map.get(rec["prog_code"])
        if not prog_id:
            continue

        subj_key = (str(prog_id), rec["sem"], rec["subj_norm"].lower())

        # ── Ensure subject exists ────────────────────────────────────────────
        if subj_key not in subj_db:
            new_sid  = str(uuid.uuid4())
            cat = infer_category(rec["subj_norm"].lower(), rec["subj_norm"])
            cur.execute(
                """
                INSERT INTO subjects (id, programme_id, name, semester_number, category)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (new_sid, prog_id, rec["subj_norm"], rec["sem"], cat),
            )
            subj_db[subj_key] = (new_sid, cat)
            subjects_added += 1
            print(f"  + Subject: [{rec['prog_code']} Sem{rec['sem']}] {rec['subj_norm']!r}")

        subject_id = subj_db[subj_key][0]

        # ── Ensure faculty_workload row(s) exist ─────────────────────────────
        if not rec["faculty_raw"]:
            continue

        # Split "FacultyA & FacultyB" or "FacultyA and FacultyB"
        parts = re.split(r"\s+(?:&|and)\s+", rec["faculty_raw"], flags=re.IGNORECASE)
        ftype = rec["ftype"]

        for i, part in enumerate(parts):
            fname = part.strip()
            if not fname or fname.lower() == "none":
                continue

            # For "Mixed" Core/visiting, assign Core to first, Visiting to rest
            if ftype == "Mixed":
                ft = "Core" if i == 0 else "Visiting"
            else:
                ft = ftype or "Core"

            wl_key = (subject_id, normalise_faculty(fname), rec["division"])
            if wl_key in existing_wl:
                skipped_existing += 1
                continue

            # Check if a similar entry exists with different casing/prefix
            found = False
            fname_norm = normalise_faculty(fname)
            for (esid, efname, ediv) in existing_wl:
                if esid == subject_id and ediv == rec["division"]:
                    # Compare normalised name suffix (ignore Dr./Prof. prefix)
                    efname_stripped = re.sub(r"^(dr\.|prof\.)\s*", "", efname)
                    fname_stripped  = re.sub(r"^(dr\.|prof\.)\s*", "", fname_norm)
                    if efname_stripped == fname_stripped:
                        found = True
                        break
            if found:
                skipped_existing += 1
                continue

            wid = str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO faculty_workload
                    (id, subject_id, user_login_id, faculty_name, faculty_type, division, academic_year)
                VALUES (%s, %s, NULL, %s, %s, %s, %s)
                """,
                (wid, subject_id, fname, ft, rec["division"], ACADEMIC_YEAR),
            )
            existing_wl.add(wl_key)
            workloads_added += 1

    conn.commit()

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n  New subjects added:        {subjects_added}")
    print(f"  New workload rows added:   {workloads_added}")
    print(f"  Skipped (already exists):  {skipped_existing}")

    print("\n=== Final row counts ===")
    for t in ["subjects", "faculty_workload"]:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"  {t:25s}: {cur.fetchone()[0]}")

    # Show the new subjects
    if subjects_added:
        print("\n=== Newly added subjects ===")
        cur.execute("""
            SELECT p.code, s.semester_number, s.name, s.category
            FROM subjects s JOIN programmes p ON s.programme_id = p.id
            ORDER BY s.created_at DESC NULLS LAST
            LIMIT 30
        """)
        # created_at doesn't exist — use a different approach
    cur.execute("""
        SELECT p.code, s.semester_number, s.name, s.category
        FROM subjects s JOIN programmes p ON s.programme_id = p.id
        WHERE s.code IS NULL
        ORDER BY p.code, s.semester_number, s.name
    """)
    print("\n=== Subjects without timetable code (mostly new additions) ===")
    for r in cur.fetchall():
        print(f"  {r[0]:12s} Sem{r[1]}  {r[3]:25s}  {r[2]}")

    cur.close()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
