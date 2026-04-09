import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from app.schemas import DraftUpdateRequest, DraftUpdateResponse, RespondRequest, InsightsResponse
from app.services.data_store import data_store
from app.services.llm_service import llm_service
from app.services.translator import translator

router = APIRouter()


@router.post("/draft", response_model=DraftUpdateResponse)
async def draft_update(request: DraftUpdateRequest):
    """Teacher sends brief notes → AI generates parent-friendly update."""
    generated = llm_service.generate_update(
        request.teacher_notes, request.classroom_id,
        year_level=request.year_level, subject=request.subject,
    )

    update = {
        "id": f"u{uuid.uuid4().hex[:8]}",
        "classroom_id": request.classroom_id,
        "teacher_notes": request.teacher_notes,
        "generated_content": generated.get("content", ""),
        "home_activities": generated.get("home_activities", []),
        "guided_prompts": generated.get("guided_prompts", []),
        "model_used": generated.get("model_used", "zephyr"),
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    data_store.append("updates.json", update)

    return DraftUpdateResponse(
        id=update["id"],
        teacher_notes=update["teacher_notes"],
        generated_content=update["generated_content"],
        home_activities=update["home_activities"],
        guided_prompts=update["guided_prompts"],
        status="draft",
    )


@router.delete("/{update_id}")
async def delete_update(update_id: str):
    """Delete a draft update."""
    all_updates = data_store.read("updates.json")
    update = next((u for u in all_updates if u["id"] == update_id), None)
    if not update:
        return {"error": "Update not found"}
    if update.get("status") == "sent":
        return {"error": "Cannot delete a sent update"}
    all_updates = [u for u in all_updates if u["id"] != update_id]
    data_store.write("updates.json", all_updates)
    return {"status": "deleted", "id": update_id}


@router.put("/{update_id}")
async def edit_update(update_id: str, request: DraftUpdateRequest):
    """Edit a draft update — regenerates content from new notes."""
    update = data_store.find_by_id("updates.json", update_id)
    if not update:
        return {"error": "Update not found"}
    if update.get("status") == "sent":
        return {"error": "Cannot edit a sent update"}

    generated = llm_service.generate_update(
        request.teacher_notes, request.classroom_id,
        year_level=request.year_level, subject=request.subject,
    )

    data_store.update_by_id("updates.json", update_id, {
        "teacher_notes": request.teacher_notes,
        "generated_content": generated.get("content", ""),
        "home_activities": generated.get("home_activities", []),
        "guided_prompts": generated.get("guided_prompts", []),
        "model_used": generated.get("model_used", "zephyr"),
    })
    return data_store.find_by_id("updates.json", update_id)


@router.post("/{update_id}/send")
async def send_update(update_id: str):
    """Mark update as sent. Translation integration in Sprint 4."""
    updated = data_store.update_by_id("updates.json", update_id, {
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    })
    if not updated:
        return {"error": "Update not found"}
    return {"status": "sent", "id": update_id}


@router.get("/feed")
async def get_feed(
    user_id: str = Query(...),
    role: str = Query(..., regex="^(teacher|parent)$"),
    classroom_id: str = Query(None),
):
    """Get updates feed for a teacher or parent."""
    updates = data_store.read("updates.json")

    if role == "teacher":
        # Teacher sees updates for a specific classroom (or all their classrooms)
        user = data_store.find_by_id("users.json", user_id)
        if not user:
            return []
        if classroom_id:
            result = [u for u in updates if u.get("classroom_id") == classroom_id]
        else:
            classrooms = data_store.filter("classrooms.json", teacher_id=user_id)
            classroom_ids = [c["id"] for c in classrooms]
            result = [u for u in updates if u.get("classroom_id") in classroom_ids]
        result.sort(key=lambda u: u.get("created_at", ""), reverse=True)
        return result

    elif role == "parent":
        # Parent sees updates for classrooms their children are in
        user = data_store.find_by_id("users.json", user_id)
        if not user:
            return []
        children_ids = user.get("children", [])
        classrooms = data_store.read("classrooms.json")
        parent_classroom_ids = set()
        for classroom in classrooms:
            for student in classroom.get("students", []):
                if student["id"] in children_ids:
                    parent_classroom_ids.add(classroom["id"])
        result = [
            u for u in updates
            if u.get("classroom_id") in parent_classroom_ids and u.get("status") == "sent"
        ]
        result.sort(key=lambda u: u.get("created_at", ""), reverse=True)
        return result

    return []


@router.post("/{update_id}/respond")
async def respond_to_update(update_id: str, request: RespondRequest):
    """Parent responds to a guided prompt."""
    update = data_store.find_by_id("updates.json", update_id)
    if not update:
        return {"error": "Update not found"}

    response = {
        "id": f"r{uuid.uuid4().hex[:8]}",
        "update_id": update_id,
        "parent_id": request.parent_id,
        "student_id": request.student_id,
        "prompt_index": request.prompt_index,
        "response_text": request.response_text,
        "original_language": translator.detect_language(request.response_text),
        "translated_text": translator.translate(request.response_text, "en"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    data_store.append("responses.json", response)
    return {"status": "ok", "id": response["id"]}


@router.get("/{update_id}/insights", response_model=InsightsResponse)
async def get_insights(update_id: str):
    """Aggregated summary of all parent responses for a given update."""
    update = data_store.find_by_id("updates.json", update_id)
    if not update:
        return InsightsResponse(
            update_id=update_id,
            total_responses=0,
            response_rate=0.0,
            summary="Update not found.",
            sentiment={},
            themes=[],
        )

    responses = data_store.filter("responses.json", update_id=update_id)

    if not responses:
        return InsightsResponse(
            update_id=update_id,
            total_responses=0,
            response_rate=0.0,
            summary="No responses yet.",
            sentiment={"positive": 0, "neutral": 0, "concerned": 0},
            themes=[],
        )

    # Count expected parents from classroom
    classroom = data_store.find_by_id("classrooms.json", update.get("classroom_id", ""))
    total_parents = 0
    if classroom:
        for student in classroom.get("students", []):
            total_parents += len(student.get("parent_ids", []))

    response_rate = len(responses) / max(total_parents, 1)

    # Use LLM to summarize
    insights = llm_service.summarize_responses(responses)

    return InsightsResponse(
        update_id=update_id,
        total_responses=len(responses),
        response_rate=round(response_rate, 2),
        summary=insights.get("summary", ""),
        sentiment=insights.get("sentiment", {}),
        themes=insights.get("themes", []),
    )
