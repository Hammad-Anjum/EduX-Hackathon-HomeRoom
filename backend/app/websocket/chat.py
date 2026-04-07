import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.data_store import data_store
from app.services.translator import translator

router = APIRouter()

# Active connections: {conversation_key: [websocket1, websocket2]}
active_connections: dict[str, list[WebSocket]] = {}


def _convo_key(user_a: str, user_b: str) -> str:
    return "-".join(sorted([user_a, user_b]))


@router.websocket("/ws/chat/{sender_id}/{receiver_id}")
async def chat_websocket(websocket: WebSocket, sender_id: str, receiver_id: str):
    await websocket.accept()

    key = _convo_key(sender_id, receiver_id)
    if key not in active_connections:
        active_connections[key] = []
    active_connections[key].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            text = payload.get("text", "")

            if not text.strip():
                continue

            # Detect language and translate
            original_lang = translator.detect_language(text)
            receiver = data_store.find_by_id("users.json", receiver_id)
            sender = data_store.find_by_id("users.json", sender_id)
            target_lang = receiver.get("language", "en") if receiver else "en"
            translated_text = translator.translate(text, target_lang, original_lang)

            # Store message
            message = {
                "id": f"m{uuid.uuid4().hex[:8]}",
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "original_text": text,
                "original_language": original_lang,
                "translated_text": translated_text,
                "translated_language": target_lang,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            data_store.append("messages.json", message)

            # Broadcast to all connections in this conversation
            broadcast = json.dumps({
                "type": "message",
                "sender_id": sender_id,
                "sender_name": sender.get("name", "Unknown") if sender else "Unknown",
                "original_text": text,
                "original_language": original_lang,
                "translated_text": translated_text,
                "translated_language": target_lang,
                "created_at": message["created_at"],
            })

            for conn in active_connections.get(key, []):
                try:
                    await conn.send_text(broadcast)
                except Exception:
                    pass

    except WebSocketDisconnect:
        active_connections[key].remove(websocket)
        if not active_connections[key]:
            del active_connections[key]
