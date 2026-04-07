from fastapi import APIRouter

from app.schemas import CurriculumAskRequest, CurriculumAskResponse, IngestResponse
from app.services.rag_service import rag_service
from app.services.curriculum_engine import curriculum_engine

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_curriculum():
    """Load all curriculum JSON files into ChromaDB (one-time setup)."""
    result = rag_service.ingest_all()
    return IngestResponse(
        status=result["status"],
        documents_ingested=result["documents_ingested"],
        collection=result["collection"],
    )


@router.post("/ask", response_model=CurriculumAskResponse)
async def ask_curriculum(request: CurriculumAskRequest):
    """Ask a curriculum question using the selected model."""
    result = curriculum_engine.query(
        question=request.question,
        year_level=request.year_level,
        subject=request.subject,
        model=request.model or "combined",
    )
    return CurriculumAskResponse(
        answer=result["answer"],
        translated_answer=None,
        sources=result["sources"],
        model_used=result.get("model_used"),
    )


@router.get("/stats")
async def get_stats():
    """Get ChromaDB collection statistics."""
    return rag_service.get_stats()


@router.get("/models")
async def get_models():
    """List available curriculum query models."""
    return curriculum_engine.get_available_models()
