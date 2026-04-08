interface Props {
  onSendVoice: (text: string) => void;
  inputText: string;
  disabled?: boolean;
}

export default function VoiceRecordButton({ onSendVoice, inputText, disabled }: Props) {
  const hasText = inputText.trim().length > 0;

  return (
    <button
      onClick={() => {
        if (hasText) onSendVoice(inputText.trim());
      }}
      disabled={disabled || !hasText}
      className="p-2 rounded-lg transition-colors disabled:opacity-50 bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
      title="Send as voice message (with audio)"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}
