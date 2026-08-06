"""
Ingest STME Odd Semester 2026-27 timetable data into Supabase.

Tables populated:
  - programmes  (kept as-is — already correct)
  - subjects    (truncated + re-inserted, de-duplicated per programme)
  - faculty_workload (truncated + re-inserted with correct academic_year)

Run from the project root:
    python3 scripts/ingest_timetable.py
"""

import re
import uuid
import psycopg2
import openpyxl
from pathlib import Path

# ─── Config ────────────────────────────────────────────────────────────────────
DB_URL = "postgresql://postgres:8591282986110418@db.nnbveokfgsbcnrnzziny.supabase.co:5432/postgres"
EXCEL_PATH = Path(__file__).parent.parent / "STME_Odd_Sem_2026-27 (3).xlsm"
ACADEMIC_YEAR = "2026-27"

# Sheet → (programme_code, semester, division)
SHEET_MAP = {
    "MBA TECH CE SEM 1":  ("MBA_TECH",   1, None),
    "B TECH CE-A SEM 1":  ("BTECH_CE",   1, "A"),
    "B TECH CE-B SEM 1":  ("BTECH_CE",   1, "B"),
    "B TECH AI&DS SEM 1": ("BTECH_AIDS", 1, None),
    "MBA TECH CE SEM 3":  ("MBA_TECH",   3, None),
    "B TECH CE-A SEM 3":  ("BTECH_CE",   3, "A"),
    "B TECH CE-B SEM 3":  ("BTECH_CE",   3, "B"),
    "B TECH AI&DS SEM 3": ("BTECH_AIDS", 3, None),
    "MBA TECH CE SEM 5":  ("MBA_TECH",   5, None),
    "B TECH CE-A SEM 5":  ("BTECH_CE",   5, "A"),
    "B TECH CE-B SEM 5":  ("BTECH_CE",   5, "B"),
    "B TECH AI&DS SEM 5": ("BTECH_AIDS", 5, None),
    "MBA TECH CE SEM 7":  ("MBA_TECH",   7, None),
    "B TECH CE SEM 7":    ("BTECH_CE",   7, None),
    "B TECH AI&DS SEM 7": ("BTECH_AIDS", 7, None),
    "MBA TECH CE SEM 9":  ("MBA_TECH",   9, None),
}

# Visiting faculty codes (based on timetable designations)
VISITING_CODES = {"PPVF", "QJ", "RZ", "RPT", "BB", "TSH", "AH", "CP", "AN", "SSF",
                  "AS", "CM", "RK", "RP", "SAG", "MN", "PDR", "KP", "IAK"}

# ─── Helpers ───────────────────────────────────────────────────────────────────

def detect_subject_table(ws):
    """Locate the subject table in a sheet and return column positions + data rows."""
    rows = list(ws.iter_rows(values_only=True))
    for i, row in enumerate(rows):
        vals = [str(v).strip() if v else "" for v in row]
        if "Subject Name" in vals:
            # find sub-header row with Theory/Practical
            sub_idx = None
            for j in range(i + 1, min(i + 5, len(rows))):
                sv = [str(v).strip() if v else "" for v in rows[j]]
                if "Theory" in sv:
                    sub_idx = j
                    break
            sub_row = rows[sub_idx] if sub_idx is not None else []
            sub_vals = [str(v).strip() if v else "" for v in sub_row]

            def col_of(haystack, needle):
                return next((k for k, v in enumerate(haystack) if needle in v), None)

            theory_col   = col_of(sub_vals, "Theory")
            practical_col = col_of(sub_vals, "Practical")
            tutorial_col  = col_of(sub_vals, "Tutorial")

            hvals = vals  # header row
            faculty_col  = col_of(hvals, "Faculty Name")
            batches_col  = col_of(hvals, "No. of Batches")

            data_start = (sub_idx + 1) if sub_idx is not None else (i + 2)
            return {
                "data_start":   data_start,
                "theory_col":   theory_col,
                "practical_col": practical_col,
                "tutorial_col": tutorial_col,
                "faculty_col":  faculty_col,
                "batches_col":  batches_col,
                "rows":         rows,
            }
    return None


def parse_category(raw: str) -> str:
    for prefix in ("DE1:", "DE2:", "DE3:", "DE4:", "DE5:", "DE6:"):
        if raw.startswith(prefix):
            return "Department Elective"
    for prefix in ("OE1:", "OE2:", "OE3:", "OE4:", "OE5:"):
        if raw.startswith(prefix):
            return "Open Elective"
    for prefix in ("PE1:", "PE2:", "PE3:"):
        if raw.startswith(prefix):
            return "Programme Elective"
    return "Core"


def clean_subject_name(raw: str) -> str:
    """Strip elective prefix and short code suffix; fix known typos."""
    name = raw.strip()
    for prefix in ("DE1: ", "DE2: ", "DE3: ", "DE4: ", "DE5: ", "DE6: ",
                   "OE1: ", "OE2: ", "OE3: ", "OE4: ", "OE5: ",
                   "PE1: ", "PE2: ", "PE3: "):
        if name.startswith(prefix):
            name = name[len(prefix):]
    # strip trailing " (CODE)" — e.g. " (CAL)", " (SE)", " (AI&DS)"
    name = re.sub(r"\s*\([A-Z][A-Z0-9&\s]{0,12}\)\s*$", "", name)
    # Fix known typo
    name = name.replace("Enviromental", "Environmental")
    return name.strip()


def extract_faculty_name(raw: str):
    """Return cleaned name and infer faculty_type from code in parentheses."""
    raw = raw.strip().rstrip("\t ")
    # determine type by code
    code_match = re.search(r"\(([A-Z]+)\)\s*$", raw)
    code = code_match.group(1) if code_match else ""
    ftype = "Visiting" if ("VF" in raw or code in VISITING_CODES) else "Core"
    return raw, ftype


def split_faculty(faculty_str: str) -> list[tuple[str, str]]:
    """Split 'FacultyA and FacultyB' / 'FacultyA & FacultyB' into list of (name, type)."""
    if not faculty_str:
        return []
    # split on ' and ' or ' & ' but be careful of "Pallavi D R"
    parts = re.split(r"\s+(?:and|&)\s+(?=[A-Z])", faculty_str)
    result = []
    for part in parts:
        part = part.strip()
        if part and not part.replace(".", "").isnumeric():
            name, ftype = extract_faculty_name(part)
            result.append((name, ftype))
    return result


# ─── Extract from Excel ─────────────────────────────────────────────────────────

def extract_records(wb) -> list[dict]:
    records = []
    for sheet_name, (prog_code, sem, division) in SHEET_MAP.items():
        ws = wb[sheet_name]
        info = detect_subject_table(ws)
        if not info:
            print(f"  WARNING: Could not find subject table in '{sheet_name}'")
            continue

        rows = info["rows"]
        for i in range(info["data_start"], len(rows)):
            row = rows[i]
            subj_raw = row[0]
            if not subj_raw:
                continue
            subj_raw_str = str(subj_raw).strip()
            if (subj_raw_str.startswith("Total")
                    or subj_raw_str.startswith("Class")
                    or subj_raw_str == ""):
                break

            def get_col(col):
                if col is None:
                    return None
                v = row[col] if col < len(row) else None
                return v

            theory    = get_col(info["theory_col"])
            practical = get_col(info["practical_col"])
            tutorial  = get_col(info["tutorial_col"])
            faculty_v = get_col(info["faculty_col"])
            batches   = get_col(info["batches_col"])

            # Skip pure sub-header rows
            if all(v is None for v in [theory, practical, tutorial, faculty_v]):
                continue
            # Skip cells where formula didn't resolve (numeric leftovers)
            if isinstance(faculty_v, (int, float)):
                faculty_v = None

            faculty_str = str(faculty_v).strip() if faculty_v else None
            subj_clean  = clean_subject_name(subj_raw_str)
            category    = parse_category(subj_raw_str)

            records.append({
                "prog_code":  prog_code,
                "sem":        sem,
                "division":   division,
                "subj_clean": subj_clean,
                "category":   category,
                "faculty_str": faculty_str,
                "theory":     int(theory) if isinstance(theory, (int, float)) else 0,
                "practical":  int(practical) if isinstance(practical, (int, float)) else 0,
                "tutorial":   int(tutorial) if isinstance(tutorial, (int, float)) else 0,
                "batches":    int(batches) if isinstance(batches, (int, float)) else 1,
            })

    return records


# ─── Ingest ─────────────────────────────────────────────────────────────────────

def ingest(records: list[dict], conn):
    cur = conn.cursor()

    # 1. Load programme id map
    cur.execute("SELECT code, id FROM programmes")
    prog_map = {row[0]: row[1] for row in cur.fetchall()}
    print(f"  Programmes found: {list(prog_map.keys())}")

    # 2. Truncate dependent tables (order matters for FK)
    print("  Truncating faculty_workload …")
    cur.execute("TRUNCATE TABLE faculty_workload CASCADE")
    print("  Truncating subjects …")
    cur.execute("TRUNCATE TABLE subjects CASCADE")
    conn.commit()

    # 3. Build de-duplicated subject list per (programme_id, name, semester)
    subject_map: dict[tuple, str] = {}  # (programme_id, name, semester) → subject_id

    # Group records, process non-division sheets first, then divided ones
    def sort_key(r):
        return (0 if r["division"] is None else 1, r["prog_code"], r["sem"])

    sorted_records = sorted(records, key=sort_key)

    subjects_inserted = 0
    workloads_inserted = 0

    for rec in sorted_records:
        prog_id = prog_map.get(rec["prog_code"])
        if prog_id is None:
            print(f"  SKIP unknown programme code: {rec['prog_code']}")
            continue

        subj_key = (prog_id, rec["subj_clean"], rec["sem"])

        # Insert subject if not seen yet
        if subj_key not in subject_map:
            sid = str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO subjects (id, programme_id, name, semester_number, category)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (sid, prog_id, rec["subj_clean"], rec["sem"], rec["category"]),
            )
            subject_map[subj_key] = sid
            subjects_inserted += 1

        sid = subject_map[subj_key]

        # Insert faculty_workload record(s)
        faculty_entries = split_faculty(rec["faculty_str"]) if rec["faculty_str"] else []
        if not faculty_entries:
            # Still insert a placeholder so the subject has a workload row
            faculty_entries = [("TBD", "Core")]

        for fname, ftype in faculty_entries:
            wid = str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO faculty_workload
                    (id, subject_id, user_login_id, faculty_name, faculty_type, division, academic_year)
                VALUES (%s, %s, NULL, %s, %s, %s, %s)
                """,
                (wid, sid, fname, ftype, rec["division"], ACADEMIC_YEAR),
            )
            workloads_inserted += 1

    conn.commit()
    cur.close()
    print(f"\n  Subjects inserted:  {subjects_inserted}")
    print(f"  Workloads inserted: {workloads_inserted}")


# ─── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f"Loading workbook: {EXCEL_PATH.name}")
    wb = openpyxl.load_workbook(str(EXCEL_PATH), keep_vba=True, data_only=True)

    print("Extracting records from sheets …")
    records = extract_records(wb)
    print(f"  Total raw records: {len(records)}")

    print(f"\nConnecting to Supabase …")
    conn = psycopg2.connect(DB_URL)

    print("Ingesting …")
    ingest(records, conn)

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
