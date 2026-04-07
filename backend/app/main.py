from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.communication import router as communication_router
from app.api.curriculum import router as curriculum_router
from app.api.messaging import router as messaging_router
from app.api.translate import router as translate_router
from app.api.users import router as users_router
from app.api.progress import router as progress_router
from app.websocket.chat import router as chat_ws_router
from app.websocket.meeting import router as meeting_ws_router

app = FastAPI(
    title="BridgeEd",
    description="Teacher-Parent Communication Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API routes
app.include_router(communication_router, prefix="/api/updates", tags=["Communication Hub"])
app.include_router(curriculum_router, prefix="/api/curriculum", tags=["Curriculum RAG"])
app.include_router(messaging_router, prefix="/api/messages", tags=["Messaging"])
app.include_router(translate_router, prefix="/api/translate", tags=["Translation"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(progress_router, prefix="/api/progress", tags=["Student Progress"])

# WebSocket routes
app.include_router(chat_ws_router, tags=["WebSocket Chat"])
app.include_router(meeting_ws_router, tags=["WebSocket Meeting"])


@app.get("/")
async def root():
    return {"status": "ok", "app": "BridgeEd", "version": "0.1.0"}
