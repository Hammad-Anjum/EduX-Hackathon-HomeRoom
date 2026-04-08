import logging
import os

from gtts import gTTS

from app.config import settings

logger = logging.getLogger(__name__)

LANG_MAP = {"zh": "zh-CN"}
AUDIO_DIR = os.path.join(settings.data_dir, "audio")


class TTSService:
    def __init__(self):
        os.makedirs(AUDIO_DIR, exist_ok=True)

    def _map_lang(self, lang: str) -> str:
        return LANG_MAP.get(lang, lang)

    def generate(self, text: str, lang: str, message_id: str, suffix: str) -> str | None:
        """Generate MP3 file. Returns relative path like 'audio/m123_original.mp3' or None."""
        if not text or not text.strip():
            return None
        filename = f"{message_id}_{suffix}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        try:
            gtts_lang = self._map_lang(lang)
            tld = "com.au" if lang == "en" else "com"
            tts = gTTS(text=text, lang=gtts_lang, tld=tld)
            tts.save(filepath)
            logger.info("TTS generated: %s (%s)", filename, gtts_lang)
            return f"audio/{filename}"
        except Exception as e:
            logger.error("TTS failed for %s: %s", filename, e)
            return None

    def generate_pair(
        self, original_text: str, original_lang: str,
        translated_text: str, translated_lang: str,
        message_id: str,
    ) -> tuple[str | None, str | None]:
        """Generate both original and translated audio."""
        orig = self.generate(original_text, original_lang, message_id, "original")
        trans = None
        if original_lang != translated_lang:
            trans = self.generate(translated_text, translated_lang, message_id, "translated")
        return orig, trans


tts_service = TTSService()
