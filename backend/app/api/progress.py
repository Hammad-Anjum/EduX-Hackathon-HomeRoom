import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import (
    AchievementUpdate, SkillUpdate, CreateAssignment,
    BulkResultsUpdate, ImportRequest,
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
    progress = data_store.filter("student_progress.json", student_id=student_id)
    skills = data_store.filter("skills.json", student_id=student_id)

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
        "progress": progress,
        "skills": skills,
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
    all_assignments = data_store.read("assignments.json")

    result = []
    for child_id in children_ids:
        # Filter progress to ONLY this child
        progress = [p for p in all_progress if p["student_id"] == child_id]
        skills = [s for s in all_skills if s["student_id"] == child_id]

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

        result.append({
            "student_id": child_id,
            "student_name": children_names.get(child_id, "Unknown"),
            "progress": progress,
            "skills": skills,
            "assignments": assignments,
        })

    return result


# ──────────────────────────────────────────────
# Integration placeholders
# ──────────────────────────────────────────────

@router.post("/import/google-sheets")
async def import_google_sheets(request: ImportRequest):
    return {
        "status": "placeholder",
        "message": f"Google Sheets import from classroom {request.classroom_id} would process data from {request.source_url or 'spreadsheet'}. Integration ready for OAuth setup.",
    }


@router.post("/import/canvas")
async def import_canvas(request: ImportRequest):
    return {
        "status": "placeholder",
        "message": f"Canvas LMS import for classroom {request.classroom_id} would sync grades and assignments. LTI integration ready.",
    }


@router.post("/import/school-portal")
async def import_school_portal(request: ImportRequest):
    return {
        "status": "placeholder",
        "message": f"School portal (Compass/Sentral/Edval) import for classroom {request.classroom_id} ready for SIS integration via LISS protocol.",
    }


@router.post("/export/csv")
async def export_csv(request: ImportRequest):
    return {
        "status": "placeholder",
        "content_type": "text/csv",
        "message": f"CSV export for classroom {request.classroom_id} would generate a downloadable file with all student progress data.",
    }
