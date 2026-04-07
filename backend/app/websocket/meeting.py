import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.data_store import data_store
from app.services.translator import translator

router = APIRouter()

# Active meeting connections: {meeting_id: {user_id: websocket}}
active_meetings: dict[str, dict[str, WebSocket]] = {}


@router.websocket("/ws/meeting/{meeting_id}")
async def meeting_websocket(websocket: WebSocket, meeting_id: str):
    await websocket.accept()

    if meeting_id not in active_meetings:
        active_meetings[meeting_id] = {}

    user_id = None

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type", "")

            if msg_type == "join":
                # Register this user in the meeting
                user_id = payload.get("user_id", "")
                active_meetings[meeting_id][user_id] = websocket

                # Notify others
                for uid, conn in active_meetings[meeting_id].items():
                    if uid != user_id:
                        try:
                            user = data_store.find_by_id("users.json", user_id)
                            await conn.send_text(json.dumps({
                                "type": "user_joined",
                                "user_id": user_id,
                                "user_name": user.get("name", "Unknown") if user else "Unknown",
                            }))
                        except Exception:
                            pass

            elif msg_type == "transcript":
                # Speech-to-text transcript from browser
                text = payload.get("text", "")
                speaker_id = payload.get("user_id", user_id or "")

                if not text.strip():
                    continue

                speaker = data_store.find_by_id("users.json", speaker_id)
                original_lang = translator.detect_language(text)

                # Translate for each other participant
                for uid, conn in active_meetings[meeting_id].items():
                    if uid == speaker_id:
                        continue
                    listener = data_store.find_by_id("users.json", uid)
                    target_lang = listener.get("language", "en") if listener else "en"
                    translated = translator.translate(text, target_lang, original_lang)

                    try:
                        await conn.send_text(json.dumps({
                            "type": "subtitle",
                            "speaker_id": speaker_id,
                            "speaker_name": speaker.get("name", "Unknown") if speaker else "Unknown",
                            "original_text": text,
                            "translated_text": translated,
                            "original_language": original_lang,
                            "translated_language": target_lang,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }))
                    except Exception:
                        pass

                # Store transcript
                meetings = data_store.read("meetings.json")
                meeting = next((m for m in meetings if m.get("id") == meeting_id), None)
                if meeting is None:
                    meeting = {
                        "id": meeting_id,
                        "status": "active",
                        "started_at": datetime.now(timezone.utc).isoformat(),
                        "transcripts": [],
                    }
                    data_store.append("meetings.json", meeting)
                    meetings = data_store.read("meetings.json")
                    meeting = next(m for m in meetings if m["id"] == meeting_id)

                meeting.setdefault("transcripts", []).append({
                    "speaker_id": speaker_id,
                    "original_text": text,
                    "original_language": original_lang,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                data_store.write("meetings.json", meetings)

    except WebSocketDisconnect:
        if user_id and meeting_id in active_meetings:
            active_meetings[meeting_id].pop(user_id, None)
            if not active_meetings[meeting_id]:
                del active_meetings[meeting_id]
