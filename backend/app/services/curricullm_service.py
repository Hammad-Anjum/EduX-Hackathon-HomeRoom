import requests
from typing import Optional

from app.config import settings


class CurricuLLMService:
    """Client for the CurricuLLM API — curriculum-aligned chat completions."""

    def __init__(self):
        self.base_url = settings.curricullm_base_url
        self.api_key = settings.curricullm_api_key
        self.model = settings.curricullm_model

    def _is_available(self) -> bool:
        return bool(self.api_key and self.api_key != "your_curricullm_key_here")

    def query(
        self,
        question: str,
        stage: Optional[str] = None,
        subject: Optional[str] = None,
    ) -> dict:
        """Query CurricuLLM with curriculum context."""
        if not self._is_available():
            return {
                "answer": None,
                "error": "CurricuLLM API key not configured.",
                "sources": [],
                "model": "curricullm",
            }

        # Build curriculum context object
        curriculum = {}
        if stage:
            curriculum["stage"] = stage
        if subject:
            curriculum["subject"] = subject

        # Build request payload (OpenAI-compatible + curriculum param)
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a helpful education assistant for parents in Australia. "
                        "Answer questions about the curriculum in plain, simple language. "
                        "Avoid jargon. Give specific, practical examples of what the child "
                        "should be able to do. Keep answers concise (3-5 sentences) and actionable."
                    ),
                },
                {
                    "role": "user",
                    "content": question,
                },
            ],
            "temperature": 0.3,
            "max_tokens": 1024,
        }

        if curriculum:
            payload["curriculum"] = curriculum

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            # Extract answer from OpenAI-compatible response
            answer = data["choices"][0]["message"]["content"]

            return {
                "answer": answer,
                "sources": [{"model": "curricullm", "id": data.get("id", "")}],
                "model": "curricullm",
            }

        except requests.exceptions.RequestException as e:
            return {
                "answer": None,
                "error": f"CurricuLLM API error: {str(e)}",
                "sources": [],
                "model": "curricullm",
            }

    def is_available(self) -> bool:
        return self._is_available()


# Singleton
curricullm_service = CurricuLLMService()
