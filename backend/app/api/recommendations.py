import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

logger = logging.getLogger(__name__)

from app.schemas import RecommendationItemUpdate
from app.services.data_store import data_store
from app.api.progress import _compute_trend

router = APIRouter()


def _gather_student_data(student_id: str) -> dict:
    """Gather all data for a student across all sources."""
    progress = data_store.filter("student_progress.json", student_id=student_id)
    skills = data_store.filter("skills.json", student_id=student_id)
    naplan = data_store.filter("naplan_results.json", student_id=student_id)

    # Assignments with this student's results
    all_assignments = data_store.read("assignments.json")
    assignments = []
    for a in all_assignments:
        result = next((r for r in a.get("results", []) if r["student_id"] == student_id), None)
        if result:
            assignments.append({
                "subject": a["subject"],
                "title": a["title"],
                "due_date": a.get("due_date", ""),
                "result": result,
            })

    # Wellbeing
    checkins = sorted(
        data_store.filter("wellbeing_checkins.json", student_id=student_id),
        key=lambda c: c["date"],
    )
    trend, trend_message = _compute_trend(checkins)
    recent_zones = [c["zone"] for c in checkins[-10:]] if checkins else []
    avg_zone = round(sum(recent_zones) / len(recent_zones), 1) if recent_zones else 0

    return {
        "progress": progress,
        "skills": skills,
        "naplan": naplan,
        "assignments": assignments,
        "wellbeing": {
            "trend": trend,
            "trend_message": trend_message,
            "avg_zone": avg_zone,
        },
    }


@router.post("/generate/{student_id}")
async def generate_recommendations(student_id: str):
    """Generate AI-powered recommendations for a student."""
    student_data = _gather_student_data(student_id)

    # Try LLM, fall back to rules
    llm_available = True
    try:
        from app.services.llm_service import llm_service
        logger.info("Calling LLM generate_recommendations for student %s", student_id)
        result = llm_service.generate_recommendations(student_data)
        logger.info("LLM returned successfully for student %s", student_id)
    except Exception as e:
        logger.error("LLM generate_recommendations failed for student %s: %s", student_id, e, exc_info=True)
        from app.services.llm_service import llm_service
        result = llm_service._fallback_recommendations(student_data)
        llm_available = False

    # Build recommendation record
    rec_id = f"rec_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    subjects = []
    for subj_data in result.get("subjects", []):
        items = []
        for rec_text in subj_data.get("recommendations", []):
            items.append({
                "id": f"ri_{uuid.uuid4().hex[:6]}",
                "text": rec_text,
                "status": "draft",
                "edited_text": None,
                "approved_at": None,
            })
        subjects.append({
            "subject": subj_data["subject"],
            "items": items,
        })

    record = {
        "id": rec_id,
        "student_id": student_id,
        "generated_at": now,
        "generated_by": "t1",
        "llm_available": llm_available,
        "summary": result.get("summary", ""),
        "wellbeing_flag": student_data["wellbeing"]["trend"],
        "subjects": subjects,
    }

    # Replace existing recommendations for this student
    all_recs = data_store.read("recommendations.json")
    all_recs = [r for r in all_recs if r["student_id"] != student_id]
    all_recs.append(record)
    data_store.write("recommendations.json", all_recs)

    return record


@router.get("/student/{student_id}")
async def get_student_recommendations(student_id: str):
    """Get full recommendation record for teacher view."""
    all_recs = data_store.read("recommendations.json")
    rec = next((r for r in all_recs if r["student_id"] == student_id), None)
    return rec


@router.patch("/{rec_id}/items/{item_id}")
async def update_recommendation_item(rec_id: str, item_id: str, request: RecommendationItemUpdate):
    """Approve, hide, or edit an individual recommendation item."""
    all_recs = data_store.read("recommendations.json")
    rec = next((r for r in all_recs if r["id"] == rec_id), None)
    if not rec:
        return {"error": "Recommendation not found"}

    now = datetime.now(timezone.utc).isoformat()

    for subj in rec.get("subjects", []):
        for item in subj.get("items", []):
            if item["id"] == item_id:
                item["status"] = request.status
                if request.edited_text is not None:
                    item["edited_text"] = request.edited_text
                if request.status == "approved":
                    item["approved_at"] = now
                data_store.write("recommendations.json", all_recs)
                return rec

    return {"error": "Item not found"}


@router.get("/parent/{parent_id}/children")
async def get_parent_recommendations(parent_id: str):
    """Get approved recommendations for parent's children. No summary, no wellbeing flag, no drafts."""
    user = data_store.find_by_id("users.json", parent_id)
    if not user:
        return []

    children_ids = user.get("children", [])
    all_recs = data_store.read("recommendations.json")

    # Resolve child names
    classrooms = data_store.read("classrooms.json")
    names: dict[str, str] = {}
    for cls in classrooms:
        for s in cls.get("students", []):
            if s["id"] in children_ids:
                names[s["id"]] = s["name"]

    result = []
    for child_id in children_ids:
        rec = next((r for r in all_recs if r["student_id"] == child_id), None)
        if not rec:
            result.append({"student_id": child_id, "student_name": names.get(child_id, ""), "subjects": []})
            continue

        # Filter to approved items only
        approved_subjects = []
        for subj in rec.get("subjects", []):
            approved_items = [
                {"text": item.get("edited_text") or item["text"]}
                for item in subj.get("items", [])
                if item["status"] == "approved"
            ]
            if approved_items:
                approved_subjects.append({"subject": subj["subject"], "items": approved_items})

        result.append({
            "student_id": child_id,
            "student_name": names.get(child_id, ""),
            "subjects": approved_subjects,
        })

    return result
