import { useEffect, useState, useRef } from 'react';
import { getThread } from '../../lib/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useTranslation } from '../../hooks/useTranslation';
import MessageBubble from '../../components/MessageBubble';
import VoiceRecordButton from '../../components/VoiceRecordButton';

interface User { id: string; name: string; role: string; language: string }

export default function Messages({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [thread, setThread] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const teacherId = 't1';
  const { messages: wsMessages, connected, send } = useWebSocket(`/ws/chat/${user.id}/${teacherId}`);

  useEffect(() => {
    getThread(teacherId, user.id).then((res) => setThread(res.data));
  }, [user.id]);

  useEffect(() => {
    if (wsMessages.length > 0) {
      const last = wsMessages[wsMessages.length - 1];
      if (last.type === 'message') {
        setThread((prev) => [...prev, last]);
      }
    }
  }, [wsMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSend = () => {
    if (!input.trim() || !connected) return;
    send({ text: input, is_voice: false });
    setInput('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('chat.title')}</h1>

      <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-14rem)]">
        <div className="p-3 border-b flex justify-between items-center">
          <span className="font-semibold text-sm">Ms. Smith</span>
          <span className={`text-xs ${connected ? 'text-green-500' : 'text-gray-400'}`}>
            {connected ? t('messages.connected') : t('messages.disconnected')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {thread.map((msg: any, i: number) => (
            <MessageBubble
              key={i}
              text={msg.original_text}
              isMine={msg.sender_id === user.id}
              userLanguage={user.language}
              originalLanguage={msg.original_language}
              isVoice={msg.is_voice}
              audioOriginal={msg.audio_original}
              audioTranslated={msg.audio_translated}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <VoiceRecordButton
            inputText={input}
            onSendVoice={(text) => { if (connected) { send({ text, is_voice: true }); setInput(''); } }}
            disabled={!connected}
          />
          <button
            onClick={handleSend}
            disabled={!connected}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('messages.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
