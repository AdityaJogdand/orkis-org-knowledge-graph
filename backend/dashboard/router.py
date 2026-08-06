from datetime import datetime, timedelta, timezone
import time as _time

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

# ── Simple in-process TTL cache ────────────────────────────────────────────────
# Timetable data is stable within a semester — cache for 5 minutes.
# Key → (value, expires_at_monotonic)
_CACHE: dict[str, tuple] = {}
_TTL   = 300  # seconds

def _cache_get(key: str):
    entry = _CACHE.get(key)
    if entry and _time.monotonic() < entry[1]:
        return entry[0]
    _CACHE.pop(key, None)
    return None

def _cache_set(key: str, value):
    _CACHE[key] = (value, _time.monotonic() + _TTL)
    return value

from ..auth.dependencies import get_current_user
from ..database import get_db
from ..models import (
    FacultyMember,
    FacultyWorkload,
    Programme,
    Subject,
    TimetableSlot,
    UserLogin,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# IST = UTC + 5:30
_IST = timezone(timedelta(hours=5, minutes=30))

# Day names as stored in timetable_slots
_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _ist_now() -> datetime:
    return datetime.now(_IST)


def _today_name() -> str:
    return _DAYS[_ist_now().weekday()]


def _now_time():
    return _ist_now().time()


def _get_faculty_member(user: UserLogin, db: Session) -> FacultyMember | None:
    return db.query(FacultyMember).filter(FacultyMember.user_login_id == user.id).first()


def _resolve_slot(slot: TimetableSlot, db: Session) -> dict:
    """Resolve subject name and programme name for a slot."""
    subj_name = slot.subject_code
    if slot.subject_id:
        s = db.get(Subject, slot.subject_id)
        if s:
            subj_name = s.name

    prog_name = None
    if slot.programme_id:
        p = db.get(Programme, slot.programme_id)
        if p:
            prog_name = p.name

    return {
        "subject":   subj_name,
        "room":      slot.venue_label or "—",
        "time":      slot.slot_start.strftime("%I:%M %p").lstrip("0"),
        "end_time":  slot.slot_end.strftime("%I:%M %p").lstrip("0"),
        "division":  slot.division or "All",
        "programme": prog_name or "—",
        "type":      slot.slot_type,
        "batch":     slot.batch,
    }


def _next_class(faculty: FacultyMember, db: Session) -> dict | None:
    if not faculty:
        return None
    today = _today_name()
    now   = _now_time()

    # 1. Check for an ongoing class (started but not yet ended)
    ongoing = (
        db.query(TimetableSlot)
        .filter(
            TimetableSlot.faculty_id == faculty.id,
            TimetableSlot.day_of_week == today,
            TimetableSlot.slot_start <= now,
            TimetableSlot.slot_end   >  now,
        )
        .order_by(TimetableSlot.slot_start)
        .first()
    )
    if ongoing:
        result = _resolve_slot(ongoing, db)
        result["status"] = "ongoing"
        return result

    # 2. Next upcoming class today
    upcoming = (
        db.query(TimetableSlot)
        .filter(
            TimetableSlot.faculty_id == faculty.id,
            TimetableSlot.day_of_week == today,
            TimetableSlot.slot_start > now,
        )
        .order_by(TimetableSlot.slot_start)
        .first()
    )
    if upcoming:
        result = _resolve_slot(upcoming, db)
        result["status"] = "upcoming"
        return result

    # 3. Check if there were any classes today at all (day ended)
    had_classes_today = (
        db.query(TimetableSlot)
        .filter(
            TimetableSlot.faculty_id == faculty.id,
            TimetableSlot.day_of_week == today,
        )
        .count()
    )
    if had_classes_today:
        return {"status": "day_ended"}

    # 4. No classes scheduled at all today (e.g. Sunday / free day)
    return {"status": "no_classes"}


# ── Chairperson dashboard ─────────────────────────────────────────────────────

@router.get("/chair")
def chair_dashboard(
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    faculty_member = _get_faculty_member(current_user, db)
    if not faculty_member or not faculty_member.chaired_programme_id:
        return {"error": "No programme assigned to this chairperson"}

    prog = db.get(Programme, faculty_member.chaired_programme_id)

    cache_key = f"chair:{current_user.id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    # ── Query 1: all subjects for this programme ──────────────────────────────
    subjects = (
        db.query(Subject)
        .filter(Subject.programme_id == prog.id)
        .order_by(Subject.semester_number, Subject.name)
        .all()
    )
    subject_ids = [s.id for s in subjects]

    # ── Query 2: all workloads for these subjects in one shot ─────────────────
    all_workloads = (
        db.query(FacultyWorkload)
        .filter(FacultyWorkload.subject_id.in_(subject_ids))
        .all()
    )
    workload_map: dict[str, list] = {}
    assigned_set: set[str] = set()
    faculty_names: set[str] = set()
    for w in all_workloads:
        key = str(w.subject_id)
        workload_map.setdefault(key, []).append({
            "name": w.faculty_name, "type": w.faculty_type, "division": w.division,
        })
        assigned_set.add(key)
        faculty_names.add(w.faculty_name)

    # Build semester-grouped structure from maps
    semesters: dict[int, list] = {}
    for s in subjects:
        semesters.setdefault(s.semester_number, []).append({
            "id":       str(s.id),
            "name":     s.name,
            "code":     s.code or "",
            "category": s.category,
            "faculty":  workload_map.get(str(s.id), []),
        })

    # Summary stats — all derived from in-memory maps, zero extra queries
    total_subjects = len(subjects)
    assigned       = len(assigned_set)
    unique_faculty = len(faculty_names)

    # Personal teaching load of the chairperson
    my_teaching = _build_faculty_payload(current_user, faculty_member, db)

    # Available semesters list
    available_semesters = sorted(semesters.keys())

    result = {
        "programme":            prog.name,
        "programme_code":       prog.code,
        "total_subjects":       total_subjects,
        "assigned_subjects":    assigned,
        "unassigned_subjects":  total_subjects - assigned,
        "total_faculty":        unique_faculty,
        "available_semesters":  available_semesters,
        "semesters":            [
            {"semester": sem, "subjects": semesters[sem]}
            for sem in sorted(semesters)
        ],
        "my_teaching": my_teaching,
    }
    return _cache_set(cache_key, result)


@router.get("/chair/available-rooms")
def chair_available_rooms(
    day: str,
    start: str,
    end: str,
    exclude_subject_id: str | None = None,   # subject whose own lecture is being replaced
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return venues FREE during [start, end) on the given day.

    exclude_subject_id: the subject being examined — its own lecture slots are
    excluded from 'occupied' because that lecture is cancelled for the exam,
    freeing the lecture room for use as an exam venue.
    """
    from datetime import time as dtime
    from ..models import Venue
    import uuid as _uuid

    def parse_time(t: str) -> dtime:
        h, m = t.split(":")
        return dtime(int(h), int(m))

    exam_start = parse_time(start)
    exam_end   = parse_time(end)

    # Base filter: overlapping slots on this day
    q = (
        db.query(TimetableSlot.venue_label)
        .filter(
            TimetableSlot.day_of_week == day,
            TimetableSlot.slot_start  <  exam_end,
            TimetableSlot.slot_end    >  exam_start,
            TimetableSlot.venue_label.isnot(None),
        )
    )

    # Exclude the subject's own slots — its lecture room becomes free
    if exclude_subject_id:
        try:
            sid = _uuid.UUID(exclude_subject_id)
            q = q.filter(TimetableSlot.subject_id != sid)
        except ValueError:
            pass

    occupied_labels = {row[0] for row in q.distinct().all()}

    # Rooms freed by this subject's own cancelled lecture
    own_slots = []
    if exclude_subject_id:
        try:
            sid = _uuid.UUID(exclude_subject_id)
            own_rows = (
                db.query(TimetableSlot.venue_label)
                .filter(
                    TimetableSlot.subject_id  == sid,
                    TimetableSlot.day_of_week == day,
                    TimetableSlot.slot_start  <  exam_end,
                    TimetableSlot.slot_end    >  exam_start,
                    TimetableSlot.venue_label.isnot(None),
                )
                .distinct()
                .all()
            )
            own_slots = [r[0] for r in own_rows]
        except ValueError:
            pass

    all_venues = db.query(Venue).order_by(Venue.label).all()
    available  = [v.label for v in all_venues if v.label not in occupied_labels]

    return {
        "day":            day,
        "start":          start,
        "end":            end,
        "available":      available,
        "occupied":       sorted(occupied_labels),
        "own_rooms":      own_slots,   # rooms freed by the subject's own cancelled lecture
        "total":          len(all_venues),
    }


@router.get("/chair/midterm-data/{semester}")
def chair_midterm_data(
    semester: int,
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all data needed to build the midterm timetable for one semester.
    Uses 5 bulk queries total — no N+1. Cached for 5 minutes.
    """
    from ..models import Venue
    faculty_member = _get_faculty_member(current_user, db)
    if not faculty_member or not faculty_member.chaired_programme_id:
        return {"error": "No programme assigned"}

    prog = db.get(Programme, faculty_member.chaired_programme_id)

    cache_key = f"midterm:{faculty_member.chaired_programme_id}:{semester}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    # ── Query 1: subjects for this semester (exclude non-exam activities) ─────
    subjects = (
        db.query(Subject)
        .filter(
            Subject.programme_id == prog.id,
            Subject.semester_number == semester,
            Subject.category != "Programme Activity",
        )
        .order_by(Subject.name)
        .all()
    )
    subject_ids = [s.id for s in subjects]

    # ── Query 2: all workloads for these subjects in one shot ─────────────────
    all_workloads = (
        db.query(FacultyWorkload)
        .filter(FacultyWorkload.subject_id.in_(subject_ids))
        .all()
    )
    workload_map: dict[str, list] = {}
    for w in all_workloads:
        workload_map.setdefault(str(w.subject_id), []).append(w.faculty_name)

    # ── Query 3: ALL slot types — Lecture/Tutorial preferred; Practical used as fallback
    # for subjects that have no theory session (e.g. EEP).
    all_slots = (
        db.query(TimetableSlot)
        .filter(TimetableSlot.subject_id.in_(subject_ids))
        .order_by(
            # Lecture first, Tutorial second, Practical last
            TimetableSlot.slot_type.desc(),   # "Tutorial" > "Practical" > "Lecture" alphabetically — use explicit sort below
            TimetableSlot.slot_start,
        )
        .all()
    )

    # Sort so Lecture slots come first, then Tutorial, then Practical
    _TYPE_PRIORITY = {"Lecture": 0, "Tutorial": 1, "Practical": 2}
    all_slots.sort(key=lambda sl: (_TYPE_PRIORITY.get(sl.slot_type, 3), sl.slot_start))

    slot_map: dict[str, list] = {}
    for sl in all_slots:
        slot_map.setdefault(str(sl.subject_id), []).append({
            "day":   sl.day_of_week,
            "start": sl.slot_start.strftime("%H:%M"),
            "end":   sl.slot_end.strftime("%H:%M"),
            "room":  sl.venue_label or "—",
            "type":  sl.slot_type,
        })

    # ── Build subject rows from maps (no more per-subject queries) ────────────
    subject_rows = [
        {
            "id":            str(s.id),
            "name":          s.name,
            "code":          s.code or "",
            "category":      s.category,
            "faculty":       list(dict.fromkeys(workload_map.get(str(s.id), []))),  # de-duped, order-preserved
            "lecture_slots": slot_map.get(str(s.id), []),
        }
        for s in subjects
    ]

    # ── Query 4: all venues ───────────────────────────────────────────────────
    venue_labels = [v.label for v in db.query(Venue).order_by(Venue.label).all()]

    # ── Query 5: all faculty in this programme (invigilator list) ────────────
    prog_subject_ids = [
        r[0] for r in
        db.query(Subject.id).filter(Subject.programme_id == prog.id).all()
    ]
    all_faculty = sorted({
        w.faculty_name
        for w in db.query(FacultyWorkload)
            .filter(FacultyWorkload.subject_id.in_(prog_subject_ids))
            .all()
    })

    result = {
        "programme":  prog.name,
        "semester":   semester,
        "subjects":   subject_rows,
        "venues":     venue_labels,
        "faculty":    all_faculty,
    }
    return _cache_set(cache_key, result)


# ── Dean dashboard ────────────────────────────────────────────────────────────

@router.get("/dean")
def dean_dashboard(
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_faculty      = db.query(FacultyWorkload.faculty_name).distinct().count()
    total_subjects     = db.query(Subject).count()
    active_programmes  = db.query(Programme).count()

    covered_ids      = db.query(FacultyWorkload.subject_id).distinct().subquery()
    subjects_covered = db.query(Subject).filter(Subject.id.in_(covered_ids)).count()
    unassigned       = total_subjects - subjects_covered
    covered_pct      = round(subjects_covered / total_subjects * 100) if total_subjects else 0

    rows = (
        db.query(
            FacultyWorkload.faculty_name,
            FacultyWorkload.faculty_type,
            func.count(FacultyWorkload.id).label("count"),
        )
        .group_by(FacultyWorkload.faculty_name, FacultyWorkload.faculty_type)
        .order_by(func.count(FacultyWorkload.id).desc())
        .all()
    )
    workload_distribution = [
        {"name": r.faculty_name, "type": r.faculty_type, "count": r.count}
        for r in rows
    ]
    overloaded = [w for w in workload_distribution if w["count"] > 5]

    type_rows = (
        db.query(
            FacultyWorkload.faculty_type,
            func.count(FacultyWorkload.faculty_name.distinct()).label("count"),
        )
        .group_by(FacultyWorkload.faculty_type)
        .all()
    )
    faculty_types = {r.faculty_type: r.count for r in type_rows}

    programmes = db.query(Programme).all()
    programme_health = []
    for prog in programmes:
        subjects = db.query(Subject).filter_by(programme_id=prog.id).all()
        sub_ids  = [s.id for s in subjects]
        p_covered = (
            db.query(FacultyWorkload.subject_id)
            .filter(FacultyWorkload.subject_id.in_(sub_ids))
            .distinct()
            .count()
            if sub_ids else 0
        )
        core = sum(1 for s in subjects if s.category == "Core")
        programme_health.append({
            "name":           prog.name,
            "code":           prog.code,
            "total_subjects": len(subjects),
            "covered":        p_covered,
            "core":           core,
            "elective":       len(subjects) - core,
            "coverage_pct":   round(p_covered / len(subjects) * 100) if subjects else 0,
        })

    # Dean also teaches — use faculty_member row for real data
    faculty_member = _get_faculty_member(current_user, db)
    my_teaching    = _build_faculty_payload(current_user, faculty_member, db)

    return {
        "total_faculty":          total_faculty,
        "subjects_covered_pct":   covered_pct,
        "active_programmes":      active_programmes,
        "pending_approvals":      3,
        "unassigned_subjects":    unassigned,
        "overloaded_faculty":     overloaded,
        "faculty_on_leave":       1,
        "workload_distribution":  workload_distribution,
        "faculty_types":          faculty_types,
        "programme_health":       programme_health,
        "my_teaching":            my_teaching,
    }


# ── Faculty dashboard ─────────────────────────────────────────────────────────

def _build_faculty_payload(user: UserLogin, faculty: FacultyMember | None, db: Session) -> dict:
    workloads = (
        db.query(FacultyWorkload)
        .filter(FacultyWorkload.user_login_id == user.id)
        .all()
    )

    subject_ids      = [w.subject_id for w in workloads]
    subjects         = db.query(Subject).filter(Subject.id.in_(subject_ids)).all() if subject_ids else []
    subject_map      = {s.id: s for s in subjects}
    unique_subjects  = list({s.id: s for s in subjects}.values())

    programme_ids    = {s.programme_id for s in subjects}
    programmes       = db.query(Programme).filter(Programme.id.in_(programme_ids)).all() if programme_ids else []
    prog_map         = {p.id: p for p in programmes}

    total_subjects   = len(unique_subjects)
    # Real weekly hours from faculty_members table; fall back to 3 h/subject estimate
    weekly_hours     = faculty.weekly_hours_total if faculty and faculty.weekly_hours_total else total_subjects * 3
    divisions        = sorted({w.division for w in workloads if w.division})
    programme_names  = [p.name for p in programmes]
    semesters        = sorted({s.semester_number for s in subjects})
    core_count       = sum(1 for s in unique_subjects if s.category == "Core")
    elective_count   = len(unique_subjects) - core_count
    faculty_type     = faculty.faculty_type if faculty else (workloads[0].faculty_type if workloads else "—")

    # Subject detail list — one row per workload assignment
    subject_details = []
    seen = set()
    for w in workloads:
        s = subject_map.get(w.subject_id)
        if not s:
            continue
        key = (s.id, w.division)
        if key in seen:
            continue
        seen.add(key)
        prog = prog_map.get(s.programme_id)
        subject_details.append({
            "name":         s.name,
            "code":         s.code or "",
            "programme":    prog.name if prog else "—",
            "semester":     s.semester_number,
            "division":     w.division,
            "category":     s.category,
            "faculty_type": w.faculty_type,
        })

    # Sort by semester then name
    subject_details.sort(key=lambda x: (x["semester"], x["name"]))

    next_cls = _next_class(faculty, db)

    return {
        "total_subjects":   total_subjects,
        "weekly_hours":     weekly_hours,
        "divisions":        divisions,
        "divisions_count":  len(divisions),
        "programmes":       programme_names,
        "programmes_count": len(programme_names),
        "semesters":        semesters,
        "core_subjects":    core_count,
        "elective_subjects": elective_count,
        "faculty_type":     faculty_type,
        "subject_details":  subject_details,
        "student_count":    total_subjects * 60,
        "leave_balance":    12,
        "next_class":       next_cls,
    }


@router.get("/faculty")
def faculty_dashboard(
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    faculty = _get_faculty_member(current_user, db)
    return _build_faculty_payload(current_user, faculty, db)
