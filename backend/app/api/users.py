from fastapi import APIRouter, Query

from app.services.data_store import data_store

router = APIRouter()


@router.get("/")
async def list_users(exclude: str = Query(None)):
    """List all users, optionally excluding one by ID."""
    users = data_store.read("users.json")
    if exclude:
        users = [u for u in users if u["id"] != exclude]
    return users


@router.get("/classrooms")
async def list_classrooms(teacher_id: str = Query(None)):
    """List classrooms, optionally filtered by teacher."""
    classrooms = data_store.read("classrooms.json")
    if teacher_id:
        classrooms = [c for c in classrooms if c.get("teacher_id") == teacher_id]
    return [{"id": c["id"], "name": c["name"], "year_level": c.get("year_level"), "student_count": len(c.get("students", []))} for c in classrooms]
