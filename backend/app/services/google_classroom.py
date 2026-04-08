"""
Google Classroom mock integration service.

Reads mock data from google_classroom_mock.json (structured to match real
Google Classroom API schemas) and transforms it into HomeRoom's data format.

To switch to real Google Classroom API later, replace `_fetch_gc_data()`
with actual google-api-python-client calls — the transform logic stays the same.
"""

import json
import os
import uuid
from datetime import datetime, timezone

from app.config import settings
from app.services.data_store import data_store


def _fetch_gc_data() -> dict:
    """Read mock Google Classroom data. Replace with real API call later."""
    path = os.path.join(settings.data_dir, "google_classroom_mock.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _map_students(gc_students: list[dict], classroom_id: str) -> dict[str, str]:
    """Map Google Classroom user IDs to HomeRoom student IDs by name matching."""
    classroom = data_store.find_by_id("classrooms.json", classroom_id)
    if not classroom:
        return {}

    hr_students = {s["name"]: s["id"] for s in classroom.get("students", [])}
    mapping = {}

    for gc_student in gc_students:
        gc_name = gc_student.get("profile", {}).get("name", {}).get("fullName", "")
        if gc_name in hr_students:
            mapping[gc_student["userId"]] = hr_students[gc_name]

    return mapping


def _format_due_date(due_date: dict | None) -> str:
    """Convert Google Classroom dueDate {year, month, day} to YYYY-MM-DD string."""
    if not due_date:
        return ""
    return f"{due_date['year']}-{due_date['month']:02d}-{due_date['day']:02d}"


def _subject_from_topic(topic_id: str | None) -> str:
    """Map Google Classroom topicId to a subject name."""
    return topic_id or "General"


def sync_from_google_classroom(classroom_id: str) -> dict:
    """
    Import assignments and grades from Google Classroom into HomeRoom.

    Returns a summary of what was imported.
    """
    gc_data = _fetch_gc_data()

    # Map GC student IDs → HomeRoom student IDs
    student_map = _map_students(gc_data.get("students", []), classroom_id)

    # Load existing assignments to dedup
    existing_assignments = data_store.read("assignments.json")
    existing_titles = {a["title"] for a in existing_assignments}

    # Build submission lookup: courseWorkId → [{userId, grade}]
    submissions_by_cw: dict[str, list[dict]] = {}
    for sub in gc_data.get("studentSubmissions", []):
        cw_id = sub["courseWorkId"]
        submissions_by_cw.setdefault(cw_id, []).append(sub)

    imported_assignments = 0
    imported_grades = 0
    skipped_assignments = 0

    for cw in gc_data.get("courseWork", []):
        title = cw["title"]

        # Skip if already imported
        if title in existing_titles:
            skipped_assignments += 1
            continue

        # Build results from submissions
        results = []
        for sub in submissions_by_cw.get(cw["id"], []):
            hr_student_id = student_map.get(sub["userId"])
            if not hr_student_id:
                continue

            grade = sub.get("assignedGrade")
            results.append({
                "student_id": hr_student_id,
                "score": grade,
                "submitted": sub.get("state") in ("TURNED_IN", "RETURNED"),
                "feedback": "",
            })
            if grade is not None:
                imported_grades += 1

        # Create HomeRoom assignment
        assignment = {
            "id": f"a_gc_{uuid.uuid4().hex[:8]}",
            "classroom_id": classroom_id,
            "subject": _subject_from_topic(cw.get("topicId")),
            "title": title,
            "description": cw.get("description", ""),
            "due_date": _format_due_date(cw.get("dueDate")),
            "created_at": cw.get("creationTime", datetime.now(timezone.utc).isoformat()),
            "created_by": "t1",
            "source": "google_classroom",
            "results": results,
        }

        data_store.append("assignments.json", assignment)
        existing_titles.add(title)
        imported_assignments += 1

    return {
        "status": "success",
        "source": "Google Classroom",
        "course_name": gc_data.get("course", {}).get("name", "Unknown"),
        "students_matched": len(student_map),
        "students_total": len(gc_data.get("students", [])),
        "imported_assignments": imported_assignments,
        "imported_grades": imported_grades,
        "skipped_existing": skipped_assignments,
    }
