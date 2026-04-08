import uuid
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.data_store import data_store
from app.services.translator import translator

router = APIRouter()


class CreatePostRequest(BaseModel):
    author_id: str
    title: str
    body: str


class CreateReplyRequest(BaseModel):
    author_id: str
    body: str


def _resolve_author(author_id: str) -> tuple[str, str]:
    """Get author name and role from users.json."""
    user = data_store.find_by_id("users.json", author_id)
    if user:
        return user.get("name", "Unknown"), user.get("role", "parent")
    return "Unknown", "parent"


@router.get("/")
async def list_posts():
    """List all forum posts, newest first."""
    posts = data_store.read("forum.json")
    posts.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    # Return posts with reply count (don't send full replies in list)
    return [
        {
            "id": p["id"],
            "author_id": p["author_id"],
            "author_name": p.get("author_name", "Unknown"),
            "author_role": p.get("author_role", "parent"),
            "title": p["title"],
            "body": p["body"],
            "original_language": p.get("original_language", "en"),
            "created_at": p["created_at"],
            "reply_count": len(p.get("replies", [])),
        }
        for p in posts
    ]


@router.get("/{post_id}")
async def get_post(post_id: str):
    """Get a single post with all replies."""
    post = data_store.find_by_id("forum.json", post_id)
    if not post:
        return {"error": "Post not found"}
    return post


@router.post("/")
async def create_post(request: CreatePostRequest):
    """Create a new forum post (parents only)."""
    name, role = _resolve_author(request.author_id)
    if role == "teacher":
        return {"error": "Teachers can only reply to posts, not create them."}
    lang = translator.detect_language(request.body)

    post = {
        "id": f"fp{uuid.uuid4().hex[:8]}",
        "author_id": request.author_id,
        "author_name": name,
        "author_role": role,
        "title": request.title,
        "body": request.body,
        "original_language": lang,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "replies": [],
    }
    data_store.append("forum.json", post)
    return post


@router.post("/{post_id}/reply")
async def reply_to_post(post_id: str, request: CreateReplyRequest):
    """Add a reply to a forum post."""
    all_posts = data_store.read("forum.json")
    post = next((p for p in all_posts if p["id"] == post_id), None)
    if not post:
        return {"error": "Post not found"}

    name, role = _resolve_author(request.author_id)
    lang = translator.detect_language(request.body)

    reply = {
        "id": f"fr{uuid.uuid4().hex[:8]}",
        "author_id": request.author_id,
        "author_name": name,
        "author_role": role,
        "body": request.body,
        "original_language": lang,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    post.setdefault("replies", []).append(reply)
    data_store.write("forum.json", all_posts)
    return post
