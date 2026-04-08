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
}

export function useSpeechRecognition(
  lang: string = 'en',
  onResult?: (text: string) => void,
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
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
      const result = event.results[0];
      if (result?.isFinal) {
        const text = result[0].transcript;
        setTranscript(text);
        onResultRef.current?.(text);
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [lang]);

  const start = useCallback(() => {
    try {
      recognitionRef.current?.start();
      setIsListening(true);
      setTranscript('');
    } catch {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, start, stop, supported };
}
