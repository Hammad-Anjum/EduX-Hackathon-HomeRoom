import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

export default function MeetingRoom({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const { meetingId } = useParams();
  const [subtitles, setSubtitles] = useState<any[]>([]);

  const { messages, connected, send } = useWebSocket(meetingId ? `/ws/meeting/${meetingId}` : null);

  const { isListening, start, stop } = useSpeechRecognition((text) => {
    send({ type: 'transcript', user_id: user.id, text });
  });

  useEffect(() => {
    if (connected) {
      send({ type: 'join', user_id: user.id });
    }
  }, [connected, user.id, send]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.type === 'subtitle') {
      setSubtitles((prev) => [...prev.slice(-20), last]);
    }
  }, [messages]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('meeting.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-500'}`}>
            {connected ? t('messages.connected') : t('meeting.connecting')}
          </span>
          <button
            onClick={isListening ? stop : start}
            className={`px-6 py-2 rounded-lg text-white ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isListening ? t('meeting.stop_mic') : t('meeting.start_mic')}
          </button>
        </div>

        {isListening && (
          <p className="text-sm text-gray-400 animate-pulse">{t('meeting.listening')}</p>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg p-6 min-h-48">
        <h2 className="text-sm text-gray-400 mb-3">{t('meeting.live')}</h2>
        {subtitles.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('meeting.subtitle_empty')}</p>
        ) : (
          <div className="space-y-2">
            {subtitles.map((s, i) => (
              <div key={i} className="text-white">
                <span className="text-indigo-400 text-sm">{s.speaker_name}: </span>
                <span className="text-lg">{s.translated_text}</span>
                {s.original_text !== s.translated_text && (
                  <span className="text-gray-500 text-sm ml-2">({s.original_text})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
