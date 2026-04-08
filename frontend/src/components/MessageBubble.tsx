import { useState, useRef } from 'react';
import TranslateButton from './TranslateButton';

interface MessageBubbleProps {
  text: string;
  isMine: boolean;
  userLanguage: string;
  originalLanguage?: string;
  isVoice?: boolean;
  audioOriginal?: string | null;
  audioTranslated?: string | null;
}

function AudioButton({ url, label, accent }: { url: string; label: string; accent?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    const audio = new Audio(`/${url}`);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play();
    audioRef.current = audio;
    setPlaying(true);
  };

  return (
    <button onClick={toggle} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
      accent ? 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        {playing
          ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          : <path d="M8 5v14l11-7z" />
        }
      </svg>
      {label}
    </button>
  );
}

export default function MessageBubble({ text, isMine, userLanguage, originalLanguage, isVoice, audioOriginal, audioTranslated }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs rounded-lg p-3 ${isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
        {isVoice && (
          <span className={`text-[10px] font-medium mb-1 block ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
            Voice message
          </span>
        )}
        <p className="text-sm">{text}</p>
        {isVoice && (audioOriginal || audioTranslated) && (
          <div className="flex gap-1.5 mt-2">
            {audioOriginal && <AudioButton url={audioOriginal} label="Original" accent={isMine} />}
            {audioTranslated && <AudioButton url={audioTranslated} label="Translated" accent={isMine} />}
          </div>
        )}
        {!isMine && (
          <TranslateButton
            text={text}
            targetLanguage={userLanguage}
            sourceLanguage={originalLanguage}
            className=""
          />
        )}
      </div>
    </div>
  );
}
