from deep_translator import GoogleTranslator
from langdetect import detect


class TranslatorService:
    """Wrapper around deep-translator for language detection and translation."""

    def translate(self, text: str, target_lang: str, source_lang: str = "auto") -> str:
        """Translate text to target language."""
        if not text or not text.strip():
            return text
        if target_lang == source_lang and source_lang != "auto":
            return text
        try:
            translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
            return translated or text
        except Exception:
            return text

    def detect_language(self, text: str) -> str:
        """Detect the language of the text. Returns ISO 639-1 code."""
        if not text or not text.strip():
            return "en"
        try:
            return detect(text)
        except Exception:
            return "en"


translator = TranslatorService()
