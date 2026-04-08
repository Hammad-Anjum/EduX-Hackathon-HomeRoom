import { useEffect, useRef, useState, useCallback } from 'react';

const STT_LANG_MAP: Record<string, string> = {
  en: 'en-AU',
  zh: 'zh-CN',
  ar: 'ar-SA',
};

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  supported: boolean;
  error: string | null;
}

export function useSpeechRecognition(
  lang: string = 'en',
  onResult?: (text: string) => void,
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = STT_LANG_MAP[lang] || lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // With interimResults=false, all results should be final
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      console.log('[STT] Result:', text);
      if (text.trim()) {
        setTranscript(text);
        onResultRef.current?.(text);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('[STT] Error:', event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[STT] Ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [lang]);

  const start = useCallback(() => {
    setError(null);
    try {
      recognitionRef.current?.start();
      setIsListening(true);
      setTranscript('');
      console.log('[STT] Started listening');
    } catch (e) {
      console.error('[STT] Start failed:', e);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, start, stop, supported, error };
}
