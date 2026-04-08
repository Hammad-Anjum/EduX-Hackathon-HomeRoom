import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface Props {
  lang: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecordButton({ lang, onTranscript, disabled }: Props) {
  const { isListening, start, stop, supported } = useSpeechRecognition(lang, onTranscript);

  if (!supported) return null;

  return (
    <button
      onClick={isListening ? stop : start}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isListening ? 'Stop recording' : 'Record voice message'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}
