from fastapi import APIRouter

from app.schemas import TranslateRequest, TranslateResponse
from app.services.translator import translator

router = APIRouter()


@router.post("/", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """On-demand translation. Called when user clicks the translate button."""
    detected_lang = request.source_language
    if detected_lang == "auto":
        detected_lang = translator.detect_language(request.text)

    translated = translator.translate(request.text, request.target_language, detected_lang)

    return TranslateResponse(
        original_text=request.text,
        translated_text=translated,
        source_language=detected_lang,
        target_language=request.target_language,
    )
