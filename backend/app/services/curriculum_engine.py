from typing import Optional

from app.services.rag_service import rag_service
from app.services.curricullm_service import curricullm_service


# Map year levels to CurricuLLM stage format
# e.g., "Year 3" -> "Stage 2", "Year 7" -> "Stage 4"
YEAR_TO_STAGE = {
    "Foundation Year": "Early Stage 1",
    "Year 1": "Stage 1",
    "Year 2": "Stage 1",
    "Year 3": "Stage 2",
    "Year 4": "Stage 2",
    "Year 5": "Stage 3",
    "Year 6": "Stage 3",
    "Year 7": "Stage 4",
    "Year 8": "Stage 4",
    "Year 9": "Stage 5",
    "Year 10": "Stage 5",
}


class CurriculumEngine:
    """
    Unified curriculum query engine with 3 modes:
      - "rag"        → Our own RAG pipeline (ChromaDB + HuggingFace)
      - "curricullm"  → CurricuLLM API
      - "combined"    → CurricuLLM first, RAG fallback
    """

    def query(
        self,
        question: str,
        year_level: Optional[str] = None,
        subject: Optional[str] = None,
        model: str = "combined",
    ) -> dict:
        if model == "rag":
            return self._query_rag(question, year_level, subject)
        elif model == "curricullm":
            return self._query_curricullm(question, year_level, subject)
        else:
            return self._query_combined(question, year_level, subject)

    def _query_rag(self, question: str, year_level: Optional[str], subject: Optional[str]) -> dict:
        """Model 1: Our RAG pipeline."""
        result = rag_service.query(question, year_level, subject)
        return {
            "answer": result["answer"],
            "sources": result["sources"],
            "model_used": "rag",
        }

    def _query_curricullm(self, question: str, year_level: Optional[str], subject: Optional[str]) -> dict:
        """Model 2: CurricuLLM API."""
        stage = YEAR_TO_STAGE.get(year_level) if year_level else None
        result = curricullm_service.query(question, stage=stage, subject=subject)

        if result.get("answer"):
            return {
                "answer": result["answer"],
                "sources": result["sources"],
                "model_used": "curricullm",
            }

        # API failed or not configured
        return {
            "answer": result.get("error", "CurricuLLM is not available."),
            "sources": [],
            "model_used": "curricullm",
            "error": True,
        }

    def _query_combined(self, question: str, year_level: Optional[str], subject: Optional[str]) -> dict:
        """Model 3: CurricuLLM priority, RAG fallback."""
        # Try CurricuLLM first
        if curricullm_service.is_available():
            stage = YEAR_TO_STAGE.get(year_level) if year_level else None
            result = curricullm_service.query(question, stage=stage, subject=subject)

            if result.get("answer"):
                # Success — also fetch RAG sources for additional context
                rag_result = rag_service.query(question, year_level, subject)
                combined_sources = result["sources"] + rag_result.get("sources", [])

                return {
                    "answer": result["answer"],
                    "sources": combined_sources,
                    "model_used": "combined (curricullm + rag sources)",
                }

        # Fallback to RAG
        rag_result = rag_service.query(question, year_level, subject)
        return {
            "answer": rag_result["answer"],
            "sources": rag_result["sources"],
            "model_used": "combined (rag fallback)",
        }

    def get_available_models(self) -> list[dict]:
        """Return which models are currently available."""
        models = [
            {
                "id": "rag",
                "name": "BridgeEd RAG",
                "description": "Our curriculum knowledge base (10,051 documents)",
                "available": True,
            },
            {
                "id": "curricullm",
                "name": "CurricuLLM",
                "description": "CurricuLLM API — curriculum-aligned AI",
                "available": curricullm_service.is_available(),
            },
            {
                "id": "combined",
                "name": "Combined (Recommended)",
                "description": "CurricuLLM priority with RAG fallback",
                "available": True,
            },
        ]
        return models


# Singleton
curriculum_engine = CurriculumEngine()
