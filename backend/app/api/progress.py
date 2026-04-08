import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter

from app.schemas import (
    AchievementUpdate, SkillUpdate, CreateAssignment,
    BulkResultsUpdate, ImportRequest, NaplanUpdate, WellbeingCheckin,
)
from app.services.data_store import data_store

router = APIRouter()


# ──────────────────────────────────────────────
# Teacher endpoints
# ──────────────────────────────────────────────

@router.get("/classroom/{classroom_id}/students")
async def list_students(classroom_id: str):
    """List all students in a classroom with their latest achievement summary."""
    classroom = data_store.find_by_id("classrooms.json", classroom_id)
    if not classroom:
        return []

    progress = data_store.read("student_progress.json")
    students = classroom.get("students", [])

    result = []
    for student in students:
        sid = student["id"]
        # Get latest achievement per subject
        student_progress = [p for p in progress if p["student_id"] == sid]
        subjects: dict[str, dict] = {}
        for p in student_progress:
            subj = p["subject"]
            if subj not in subjects or p["term"] > subjects[subj]["term"]:
                subjects[subj] = p

        result.append({
            "id": sid,
            "name": student["name"],
            "parent_ids": student.get("parent_ids", []),
            "achievements": subjects,
        })

    return result


@router.get("/student/{student_id}")
async def get_student_detail(student_id: str):
    """Full progress detail for one student."""
    # Resolve student name
    student_name = student_id
    for cls in data_store.read("classrooms.json"):
        for s in cls.get("students", []):
            if s["id"] == student_id:
                student_name = s["name"]
                break

    progress = data_store.filter("student_progress.json", student_id=student_id)
    skills = data_store.filter("skills.json", student_id=student_id)
    naplan = data_store.filter("naplan_results.json", student_id=student_id)

    # Get assignments where this student has results
    all_assignments = data_store.read("assignments.json")
    assignments = []
    for a in all_assignments:
        student_result = next(
            (r for r in a.get("results", []) if r["student_id"] == student_id),
            None,
        )
        if student_result:
            assignments.append({
                "id": a["id"],
                "subject": a["subject"],
                "title": a["title"],
                "description": a.get("description", ""),
                "due_date": a.get("due_date", ""),
                "result": student_result,
            })

    return {
        "student_id": student_id,
        "student_name": student_name,
        "progress": progress,
        "skills": skills,
        "naplan": naplan,
        "assignments": assignments,
    }


@router.post("/student/{student_id}/achievement")
async def update_achievement(student_id: str, request: AchievementUpdate):
    """Create or update an achievement record for a student."""
    all_progress = data_store.read("student_progress.json")

    # Find existing record for this student + subject + term
    existing = next(
        (p for p in all_progress
         if p["student_id"] == student_id
         and p["subject"] == request.subject
         and p["term"] == request.term),
        None,
    )

    now = datetime.now(timezone.utc).isoformat()

    if existing:
        existing.update({
            "achievement_level": request.achievement_level,
            "naplan_band": request.naplan_band or existing.get("naplan_band", ""),
            "score": request.score if request.score is not None else existing.get("score"),
            "teacher_comment": request.teacher_comment or existing.get("teacher_comment", ""),
            "updated_at": now,
        })
        data_store.write("student_progress.json", all_progress)
        return existing
    else:
        record = {
            "id": f"sp{uuid.uuid4().hex[:8]}",
            "student_id": student_id,
            "subject": request.subject,
            "term": request.term,
            "achievement_level": request.achievement_level,
            "naplan_band": request.naplan_band or "",
            "score": request.score,
            "teacher_comment": request.teacher_comment or "",
            "updated_at": now,
            "updated_by": "t1",
        }
        data_store.append("student_progress.json", record)
        return record


@router.post("/student/{student_id}/skill")
async def update_skill(student_id: str, request: SkillUpdate):
    """Create or update a skill mastery record."""
    all_skills = data_store.read("skills.json")

    existing = next(
        (s for s in all_skills
         if s["student_id"] == student_id
         and s["skill_name"] == request.skill_name),
        None,
    )

    now = datetime.now(timezone.utc).isoformat()

    if existing:
        existing["level"] = request.level
        existing["updated_at"] = now
        data_store.write("skills.json", all_skills)
        return existing
    else:
        record = {
            "id": f"sk{uuid.uuid4().hex[:8]}",
            "student_id": student_id,
            "subject": request.subject,
            "skill_name": request.skill_name,
            "level": request.level,
            "updated_at": now,
            "updated_by": "t1",
        }
        data_store.append("skills.json", record)
        return record


@router.post("/student/{student_id}/naplan")
async def update_naplan(student_id: str, request: NaplanUpdate):
    """Create or update a NAPLAN result for a student."""
    all_naplan = data_store.read("naplan_results.json")

    existing = next(
        (n for n in all_naplan
         if n["student_id"] == student_id
         and n["domain"] == request.domain
         and n["year"] == request.year),
        None,
    )

    now = datetime.now(timezone.utc).isoformat()

    if existing:
        existing["band"] = request.band
        if request.score is not None:
            existing["score"] = request.score
        existing["updated_at"] = now
        data_store.write("naplan_results.json", all_naplan)
        return existing
    else:
        record = {
            "id": f"np{uuid.uuid4().hex[:8]}",
            "student_id": student_id,
            "year": request.year,
            "domain": request.domain,
            "band": request.band,
            "score": request.score,
            "updated_at": now,
        }
        data_store.append("naplan_results.json", record)
        return record


@router.post("/student/{student_id}/assignment-result")
async def update_student_assignment_result(student_id: str, assignment_id: str, score: float = None, feedback: str = ""):
    """Update a single student's result on an assignment (by query params)."""
    all_assignments = data_store.read("assignments.json")
    assignment = next((a for a in all_assignments if a["id"] == assignment_id), None)
    if not assignment:
        return {"error": "Assignment not found"}

    existing = next(
        (r for r in assignment["results"] if r["student_id"] == student_id),
        None,
    )
    if existing:
        if score is not None:
            existing["score"] = score
        existing["feedback"] = feedback
        existing["submitted"] = True
    else:
        assignment["results"].append({
            "student_id": student_id,
            "score": score,
            "submitted": True,
            "feedback": feedback,
        })

    data_store.write("assignments.json", all_assignments)
    return assignment


@router.post("/assignments")
async def create_assignment(request: CreateAssignment):
    """Create a new assignment."""
    assignment = {
        "id": f"a{uuid.uuid4().hex[:8]}",
        "classroom_id": request.classroom_id,
        "subject": request.subject,
        "title": request.title,
        "description": request.description or "",
        "due_date": request.due_date or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "t1",
        "results": [],
    }
    data_store.append("assignments.json", assignment)
    return assignment


@router.put("/assignments/{assignment_id}/results")
async def update_results(assignment_id: str, request: BulkResultsUpdate):
    """Bulk update student results for an assignment."""
    all_assignments = data_store.read("assignments.json")
    assignment = next((a for a in all_assignments if a["id"] == assignment_id), None)
    if not assignment:
        return {"error": "Assignment not found"}

    for result in request.results:
        existing = next(
            (r for r in assignment["results"] if r["student_id"] == result.student_id),
            None,
        )
        if existing:
            existing.update(result.model_dump())
        else:
            assignment["results"].append(result.model_dump())

    data_store.write("assignments.json", all_assignments)
    return assignment


# ──────────────────────────────────────────────
# Parent endpoint (read-only, non-comparative)
# ──────────────────────────────────────────────

@router.get("/parent/{parent_id}/children")
async def get_parent_children_progress(parent_id: str):
    """Progress for all children of this parent. ONLY their child's data."""
    user = data_store.find_by_id("users.json", parent_id)
    if not user:
        return []

    children_ids = user.get("children", [])
    classrooms = data_store.read("classrooms.json")

    # Resolve child names
    children_names: dict[str, str] = {}
    for classroom in classrooms:
        for student in classroom.get("students", []):
            if student["id"] in children_ids:
                children_names[student["id"]] = student["name"]

    all_progress = data_store.read("student_progress.json")
    all_skills = data_store.read("skills.json")
    all_naplan = data_store.read("naplan_results.json")
    all_assignments = data_store.read("assignments.json")
    all_checkins = data_store.read("wellbeing_checkins.json")

    result = []
    for child_id in children_ids:
        # Filter progress to ONLY this child
        progress = [p for p in all_progress if p["student_id"] == child_id]
        skills = [s for s in all_skills if s["student_id"] == child_id]
        naplan = [n for n in all_naplan if n["student_id"] == child_id]

        # Filter assignments — only include this child's result, strip all others
        assignments = []
        for a in all_assignments:
            child_result = next(
                (r for r in a.get("results", []) if r["student_id"] == child_id),
                None,
            )
            if child_result:
                assignments.append({
                    "id": a["id"],
                    "subject": a["subject"],
                    "title": a["title"],
                    "due_date": a.get("due_date", ""),
                    "result": child_result,
                })

        # Wellbeing: only check-ins, NO teacher_note (privacy)
        child_checkins = sorted(
            [c for c in all_checkins if c["student_id"] == child_id],
            key=lambda c: c["date"],
        )
        safe_checkins = [
            {"id": c["id"], "date": c["date"], "zone": c["zone"]}
            for c in child_checkins
        ]
        trend, trend_message = _compute_trend(child_checkins)

        result.append({
            "student_id": child_id,
            "student_name": children_names.get(child_id, "Unknown"),
            "progress": progress,
            "skills": skills,
            "naplan": naplan,
            "assignments": assignments,
            "wellbeing": {
                "checkins": safe_checkins,
                "trend": trend,
                "trend_message": trend_message,
            },
        })

    return result


# ──────────────────────────────────────────────
# Wellbeing check-ins
# ──────────────────────────────────────────────

ZONE_LABELS = {
    1: "Having a tough day",
    2: "Not great",
    3: "Doing okay",
    4: "Feeling good",
    5: "Feeling awesome!",
}


def _compute_trend(checkins: list[dict]) -> tuple[str, str]:
    """Compare last 7 days avg vs previous 7 days. Returns (trend, message)."""
    if not checkins:
        return "steady", "No check-ins yet."

    today = datetime.now(timezone.utc).date()
    recent = [c["zone"] for c in checkins if (today - datetime.fromisoformat(c["date"]).date()).days <= 7]
    previous = [c["zone"] for c in checkins if 7 < (today - datetime.fromisoformat(c["date"]).date()).days <= 14]

    if not recent:
        return "steady", "No recent check-ins."

    avg_recent = sum(recent) / len(recent)

    if not previous:
        label = ZONE_LABELS.get(round(avg_recent), "Doing okay")
        return "steady", f"Mostly: {label}"

    avg_prev = sum(previous) / len(previous)
    diff = avg_recent - avg_prev

    if diff > 0.4:
        return "improving", "Trending upward recently."
    elif diff < -0.4:
        return "declining", "Seems a bit lower recently."
    else:
        label = ZONE_LABELS.get(round(avg_recent), "Doing okay")
        return "steady", f"Mostly: {label}"


@router.post("/student/{student_id}/checkin")
async def log_checkin(student_id: str, request: WellbeingCheckin):
    """Log a daily wellbeing check-in for a student."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_checkins = data_store.read("wellbeing_checkins.json")

    # Update if today's entry already exists
    existing = next(
        (c for c in all_checkins if c["student_id"] == student_id and c["date"] == today),
        None,
    )

    if existing:
        existing["zone"] = request.zone
        if request.teacher_note:
            existing["teacher_note"] = request.teacher_note
        data_store.write("wellbeing_checkins.json", all_checkins)
        return existing
    else:
        record = {
            "id": f"wc_{uuid.uuid4().hex[:8]}",
            "student_id": student_id,
            "classroom_id": request.classroom_id,
            "date": today,
            "zone": request.zone,
            "teacher_note": request.teacher_note or "",
            "entered_by": "t1",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        data_store.append("wellbeing_checkins.json", record)
        return record


@router.get("/student/{student_id}/checkins")
async def get_student_checkins(student_id: str, days: int = 30):
    """Get recent wellbeing check-ins for a student (teacher view, includes notes)."""
    all_checkins = data_store.read("wellbeing_checkins.json")
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    student_checkins = sorted(
        [c for c in all_checkins if c["student_id"] == student_id and c["date"] >= cutoff],
        key=lambda c: c["date"],
    )
    trend, trend_message = _compute_trend(student_checkins)
    return {
        "checkins": student_checkins,
        "trend": trend,
        "trend_message": trend_message,
    }


@router.get("/classroom/{classroom_id}/checkins")
async def get_classroom_checkins(classroom_id: str):
    """Today's check-in status for all students (class overview)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_checkins = data_store.read("wellbeing_checkins.json")

    classroom = data_store.find_by_id("classrooms.json", classroom_id)
    if not classroom:
        return []

    result = []
    for student in classroom.get("students", []):
        sid = student["id"]
        today_checkin = next(
            (c for c in all_checkins if c["student_id"] == sid and c["date"] == today),
            None,
        )
        # Also get latest if not today
        student_checkins = sorted(
            [c for c in all_checkins if c["student_id"] == sid],
            key=lambda c: c["date"], reverse=True,
        )
        latest = student_checkins[0] if student_checkins else None

        result.append({
            "student_id": sid,
            "name": student["name"],
            "today": {"zone": today_checkin["zone"], "date": today_checkin["date"]} if today_checkin else None,
            "latest": {"zone": latest["zone"], "date": latest["date"]} if latest else None,
        })

    return result


# ──────────────────────────────────────────────
# Integrations
# ──────────────────────────────────────────────

@router.post("/import/google-classroom")
async def import_google_classroom(request: ImportRequest):
    """Import assignments and grades from Google Classroom."""
    from app.services.google_classroom import sync_from_google_classroom
    return sync_from_google_classroom(request.classroom_id)


@router.post("/import/google-sheets")
async def import_google_sheets(request: ImportRequest):
    return {
        "status": "placeholder",
        "message": f"Google Sheets import from classroom {request.classroom_id} would process data from {request.source_url or 'spreadsheet'}. Integration ready for OAuth setup.",
    }


@router.post("/import/school-portal")
async def import_school_portal(request: ImportRequest):
    return {
        "status": "placeholder",
        "message": f"School portal (Compass/Sentral/Edval) import for classroom {request.classroom_id} ready for SIS integration via LISS protocol.",
    }


@router.get("/export/csv/{classroom_id}")
async def export_csv(classroom_id: str):
    """Export all student progress for a classroom as CSV."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    classroom = data_store.find_by_id("classrooms.json", classroom_id)
    if not classroom:
        return {"error": "Classroom not found"}

    students = classroom.get("students", [])
    progress = data_store.read("student_progress.json")
    skills = data_store.read("skills.json")
    naplan = data_store.read("naplan_results.json")
    assignments = data_store.read("assignments.json")

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Section", "Student", "Subject/Domain", "Term/Year", "Metric", "Value"])

    for student in students:
        sid = student["id"]
        name = student["name"]

        # Achievement rows
        for p in progress:
            if p["student_id"] != sid:
                continue
            writer.writerow(["Achievement", name, p["subject"], p.get("term", ""), "Level", p.get("achievement_level", "")])
            if p.get("score") is not None:
                writer.writerow(["Achievement", name, p["subject"], p.get("term", ""), "Score", p["score"]])

        # NAPLAN rows
        for n in naplan:
            if n["student_id"] != sid:
                continue
            writer.writerow(["NAPLAN", name, n["domain"], str(n.get("year", "")), "Band", n.get("band", "")])
            if n.get("score") is not None:
                writer.writerow(["NAPLAN", name, n["domain"], str(n.get("year", "")), "Score", n["score"]])

        # Skill rows
        for s in skills:
            if s["student_id"] != sid:
                continue
            writer.writerow(["Skill", name, s["subject"], s["skill_name"], "Level", s["level"]])

        # Assignment rows
        for a in assignments:
            result = next((r for r in a.get("results", []) if r["student_id"] == sid), None)
            if result:
                writer.writerow(["Assignment", name, a["subject"], a["title"], "Score", result.get("score", "")])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=homeroom_{classroom_id}_export.csv"},
    )
