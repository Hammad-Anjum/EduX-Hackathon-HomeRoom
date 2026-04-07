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
