from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_user, require_role
from ..database import get_db
from ..models import FacultyWorkload, Programme, Subject, UserLogin

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/dean")
def dean_dashboard(
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_faculty = db.query(FacultyWorkload.faculty_name).distinct().count()
    total_subjects = db.query(Subject).count()
    active_programmes = db.query(Programme).count()

    covered_ids = db.query(FacultyWorkload.subject_id).distinct().subquery()
    subjects_covered = db.query(Subject).filter(Subject.id.in_(covered_ids)).count()
    unassigned = total_subjects - subjects_covered
    covered_pct = round(subjects_covered / total_subjects * 100) if total_subjects else 0

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
        sub_ids = [s.id for s in subjects]
        p_covered = (
            db.query(FacultyWorkload.subject_id)
            .filter(FacultyWorkload.subject_id.in_(sub_ids))
            .distinct()
            .count()
            if sub_ids else 0
        )
        core = sum(1 for s in subjects if s.category == "Core")
        programme_health.append({
            "name": prog.name,
            "code": prog.code,
            "total_subjects": len(subjects),
            "covered": p_covered,
            "core": core,
            "elective": len(subjects) - core,
            "coverage_pct": round(p_covered / len(subjects) * 100) if subjects else 0,
        })

    # ── Personal teaching load (dean also teaches) ───────────────
    my_workloads = (
        db.query(FacultyWorkload)
        .filter(FacultyWorkload.user_login_id == current_user.id)
        .all()
    )
    my_subject_ids = list({w.subject_id for w in my_workloads})
    my_subjects = db.query(Subject).filter(Subject.id.in_(my_subject_ids)).all() if my_subject_ids else []
    my_unique = {s.id: s for s in my_subjects}
    my_core = sum(1 for s in my_unique.values() if s.category == "Core")
    my_sems = sorted({s.semester_number for s in my_subjects})
    my_type = my_workloads[0].faculty_type if my_workloads else "—"

    return {
        "total_faculty": total_faculty,
        "subjects_covered_pct": covered_pct,
        "active_programmes": active_programmes,
        "pending_approvals": 3,
        "unassigned_subjects": unassigned,
        "overloaded_faculty": overloaded,
        "faculty_on_leave": 1,
        "workload_distribution": workload_distribution,
        "faculty_types": faculty_types,
        "programme_health": programme_health,
        # personal teaching
        "my_teaching": {
            "total_subjects": len(my_subject_ids),
            "weekly_hours": len(my_subject_ids) * 3,
            "semesters": my_sems,
            "core_subjects": my_core,
            "elective_subjects": len(my_subject_ids) - my_core,
            "faculty_type": my_type,
            "leave_balance": 12,
            "next_class": None,
        },
    }


@router.get("/faculty")
def faculty_dashboard(
    current_user: UserLogin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # All workload rows for this faculty member
    workloads = (
        db.query(FacultyWorkload)
        .filter(FacultyWorkload.user_login_id == current_user.id)
        .all()
    )

    # Distinct subjects (not assignments/sections)
    total_subjects = len({w.subject_id for w in workloads})
    weekly_hours = total_subjects * 3  # 3 hrs per subject per week

    # Distinct divisions (filter out None)
    divisions = sorted({w.division for w in workloads if w.division})

    # Distinct programmes via subjects
    subject_ids = [w.subject_id for w in workloads]
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all() if subject_ids else []
    subject_map = {s.id: s for s in subjects}

    programme_ids = {s.programme_id for s in subjects}
    programmes = db.query(Programme).filter(Programme.id.in_(programme_ids)).all() if programme_ids else []
    programme_names = [p.name for p in programmes]

    # Semesters active
    semesters = sorted({s.semester_number for s in subjects})

    # Core vs elective breakdown — unique subjects only
    unique_subjects = list({s.id: s for s in subjects}.values())
    core_count = sum(1 for s in unique_subjects if s.category == "Core")
    elective_count = len(unique_subjects) - core_count

    # Subject detail list
    subject_details = []
    for w in workloads:
        s = subject_map.get(w.subject_id)
        if not s:
            continue
        prog = next((p for p in programmes if p.id == s.programme_id), None)
        subject_details.append({
            "name": s.name,
            "programme": prog.name if prog else "—",
            "semester": s.semester_number,
            "division": w.division,
            "category": s.category,
            "faculty_type": w.faculty_type,
        })

    # Faculty type (Core / Visiting)
    faculty_type = workloads[0].faculty_type if workloads else "—"

    return {
        "total_subjects": total_subjects,
        "weekly_hours": weekly_hours,
        "divisions": divisions,
        "divisions_count": len(divisions),
        "programmes": programme_names,
        "programmes_count": len(programme_names),
        "semesters": semesters,
        "core_subjects": core_count,
        "elective_subjects": elective_count,
        "faculty_type": faculty_type,
        "subject_details": subject_details,
        # mock — no tables yet
        "student_count": total_subjects * 60,
        "leave_balance": 12,
    }
