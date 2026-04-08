import logging
import requests
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class CurricuLLMService:
    """Client for the CurricuLLM API — curriculum-aligned chat completions."""

    def __init__(self):
        self.base_url = settings.curricullm_base_url
        self.api_key = settings.curricullm_api_key
        self.model = settings.curricullm_model  # "CurricuLLM-AU"

    def _is_available(self) -> bool:
        return bool(self.api_key and self.api_key != "your_curricullm_key_here")

    def _call(
        self,
        messages: list[dict],
        stage: Optional[str] = None,
        subject: Optional[str] = None,
        response_format: Optional[dict] = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
    ) -> dict | None:
        """Low-level CurricuLLM API call."""
        if not self._is_available():
            return None

        payload: dict = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Curriculum context
        curriculum = {}
        if stage:
            curriculum["stage"] = stage
        if subject:
            curriculum["subject"] = subject
        if curriculum:
            payload["curriculum"] = curriculum

        # JSON response format
        if response_format:
            payload["response_format"] = response_format

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            logger.info("CurricuLLM request: model=%s, stage=%s, subject=%s", self.model, stage, subject)
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
            logger.info("CurricuLLM response: %s", answer[:200])
            return {
                "answer": answer,
                "sources": [{"model": self.model, "id": data.get("id", "")}],
            }
        except requests.exceptions.RequestException as e:
            logger.error("CurricuLLM API error: %s", e)
            return None

    def query(
        self,
        question: str,
        stage: Optional[str] = None,
        subject: Optional[str] = None,
    ) -> dict:
        """Query CurricuLLM with curriculum context. Returns {answer, sources, model}."""
        result = self._call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful education assistant for parents in Australia. "
                        "Answer questions about the curriculum in plain, simple language. "
                        "Avoid jargon. Give specific, practical examples of what the child "
                        "should be able to do. Keep answers concise (3-5 sentences) and actionable."
                    ),
                },
                {"role": "user", "content": question},
            ],
            stage=stage,
            subject=subject,
        )

        if result:
            return {
                "answer": result["answer"],
                "sources": result["sources"],
                "model": self.model,
            }

        return {
            "answer": None,
            "error": "CurricuLLM API not available.",
            "sources": [],
            "model": self.model,
        }

    def generate_parent_update(
        self,
        teacher_notes: str,
        stage: Optional[str] = None,
    ) -> dict | None:
        """Generate a curriculum-aligned parent update directly via CurricuLLM with JSON output."""
        result = self._call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a school communication assistant for Australian primary schools. "
                        "Generate a warm, parent-friendly weekly update based on the teacher's notes. "
                        "Reference the Australian Curriculum where relevant. "
                        "Respond in JSON with keys: content (2 paragraph string), "
                        "home_activities (array of 3 strings), guided_prompts (array of 3 question strings)."
                    ),
                },
                {"role": "user", "content": f"Teacher's notes: {teacher_notes}"},
            ],
            stage=stage,
            response_format={"type": "json_object"},
            max_tokens=1024,
        )

        if result and result.get("answer"):
            import json
            try:
                parsed = json.loads(result["answer"])
                return {
                    "content": parsed.get("content", ""),
                    "home_activities": parsed.get("home_activities", []),
                    "guided_prompts": parsed.get("guided_prompts", []),
                }
            except json.JSONDecodeError:
                logger.warning("CurricuLLM JSON parse failed for update generation")
        return None

    def generate_recommendations_context(
        self,
        subject: str,
        stage: Optional[str] = None,
    ) -> str | None:
        """Get curriculum expectations for a subject to enrich recommendations."""
        result = self._call(
            messages=[
                {
                    "role": "system",
                    "content": "You are an Australian Curriculum expert. Provide concise curriculum expectations.",
                },
                {
                    "role": "user",
                    "content": f"What are the key expectations for {subject} at this stage in the Australian Curriculum? List 3-4 specific skills students should demonstrate.",
                },
            ],
            stage=stage,
            subject=subject,
            max_tokens=300,
        )
        return result["answer"] if result else None

    def is_available(self) -> bool:
        return self._is_available()


# Singleton
curricullm_service = CurricuLLMService()
