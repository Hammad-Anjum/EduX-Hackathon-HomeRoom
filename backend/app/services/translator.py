import logging
from deep_translator import GoogleTranslator
from langdetect import detect

logger = logging.getLogger(__name__)

# Map app language codes to Google Translate codes
LANG_MAP = {
    "zh": "zh-CN",
}


class TranslatorService:
    """Wrapper around deep-translator for language detection and translation."""

    def _map_lang(self, lang: str) -> str:
        return LANG_MAP.get(lang, lang)

    def translate(self, text: str, target_lang: str, source_lang: str = "auto") -> str:
        """Translate text to target language."""
        if not text or not text.strip():
            return text
        target_lang = self._map_lang(target_lang)
        if source_lang != "auto":
            source_lang = self._map_lang(source_lang)
        if target_lang == source_lang and source_lang != "auto":
            return text
        logger.info("Translating [%s -> %s]: %s", source_lang, target_lang, text[:80])
        try:
            translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
            logger.info("Translation result: %s", (translated or "")[:80])
            return translated or text
        except Exception as e:
            logger.error("Translation failed [%s -> %s]: %s", source_lang, target_lang, e, exc_info=True)
            return text

    def detect_language(self, text: str) -> str:
        """Detect the language of the text. Returns ISO 639-1 code."""
        if not text or not text.strip():
            return "en"
        try:
            lang = detect(text)
            logger.info("Detected language: %s for text: %s", lang, text[:50])
            return lang
        except Exception as e:
            logger.error("Language detection failed: %s", e)
            return "en"


translator = TranslatorService()
