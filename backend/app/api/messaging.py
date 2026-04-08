import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from app.schemas import SendMessageRequest, MessageResponse
from app.services.data_store import data_store
from app.services.translator import translator
from app.services.tts_service import tts_service

router = APIRouter()


@router.post("/send", response_model=MessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a translated direct message."""
    # Detect sender's language
    original_lang = translator.detect_language(request.text)

    # Get receiver's preferred language
    receiver = data_store.find_by_id("users.json", request.receiver_id)
    target_lang = receiver.get("language", "en") if receiver else "en"

    # Translate if needed
    translated_text = translator.translate(request.text, target_lang, original_lang)

    msg_id = f"m{uuid.uuid4().hex[:8]}"

    # Generate TTS for voice messages
    audio_original = None
    audio_translated = None
    if request.is_voice:
        audio_original, audio_translated = tts_service.generate_pair(
            request.text, original_lang, translated_text, target_lang, msg_id,
        )

    message = {
        "id": msg_id,
        "sender_id": request.sender_id,
        "receiver_id": request.receiver_id,
        "student_id": request.student_id or "",
        "original_text": request.text,
        "original_language": original_lang,
        "translated_text": translated_text,
        "translated_language": target_lang,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_voice": request.is_voice,
        "audio_original": audio_original,
        "audio_translated": audio_translated,
    }

    data_store.append("messages.json", message)

    return MessageResponse(**message)


@router.get("/conversations")
async def list_conversations(user_id: str = Query(...)):
    """List all conversation threads for a user."""
    messages = data_store.read("messages.json")
    users = data_store.read("users.json")
    user_map = {u["id"]: u["name"] for u in users}

    # Group by the other party
    threads = {}
    for msg in messages:
        if msg["sender_id"] == user_id:
            other_id = msg["receiver_id"]
        elif msg["receiver_id"] == user_id:
            other_id = msg["sender_id"]
        else:
            continue

        if other_id not in threads:
            threads[other_id] = {
                "user_id": other_id,
                "user_name": user_map.get(other_id, "Unknown"),
                "last_message": msg["original_text"],
                "last_at": msg["created_at"],
                "count": 0,
            }
        threads[other_id]["last_message"] = msg["original_text"]
        threads[other_id]["last_at"] = msg["created_at"]
        threads[other_id]["count"] += 1

    return list(threads.values())


@router.get("/{other_user_id}")
async def get_thread(other_user_id: str, user_id: str = Query(...)):
    """Get full message history between two users."""
    messages = data_store.read("messages.json")
    thread = [
        msg for msg in messages
        if (msg["sender_id"] == user_id and msg["receiver_id"] == other_user_id)
        or (msg["sender_id"] == other_user_id and msg["receiver_id"] == user_id)
    ]
    return sorted(thread, key=lambda m: m["created_at"])
