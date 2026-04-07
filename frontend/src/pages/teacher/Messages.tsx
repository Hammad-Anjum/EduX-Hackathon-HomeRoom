import { useEffect, useState, useRef } from 'react';
import { getConversations, getThread, getUsers } from '../../lib/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useTranslation } from '../../hooks/useTranslation';
import MessageBubble from '../../components/MessageBubble';

interface User { id: string; name: string; role: string; language: string }

export default function Messages({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [conversations, setConversations] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const wsUrl = selectedUser ? `/ws/chat/${user.id}/${selectedUser}` : null;
  const { messages: wsMessages, connected, send } = useWebSocket(wsUrl);

  useEffect(() => {
    getConversations(user.id).then((res) => setConversations(res.data));
    getUsers(user.id).then((res) => setAllContacts(res.data));
  }, [user.id]);

  useEffect(() => {
    if (!selectedUser) return;
    setThread([]);
    getThread(selectedUser, user.id).then((res) => setThread(res.data));
  }, [selectedUser, user.id]);

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
    send({ text: input });
    setInput('');
  };

  const existingIds = new Set(conversations.map((c: any) => c.user_id));
  const newChatContacts = allContacts.filter((c: any) => !existingIds.has(c.id));

  const startNewChat = (contactId: string) => {
    const contact = allContacts.find((c: any) => c.id === contactId);
    if (contact && !existingIds.has(contactId)) {
      setConversations((prev) => [
        ...prev,
        { user_id: contact.id, user_name: contact.name, last_message: '', last_at: '', count: 0 },
      ]);
    }
    setSelectedUser(contactId);
    setShowNewChat(false);
  };

  const selectedName =
    conversations.find((c: any) => c.user_id === selectedUser)?.user_name
    || allContacts.find((c: any) => c.id === selectedUser)?.name
    || 'Unknown';

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      <div className="w-64 bg-white rounded-lg shadow overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-semibold text-gray-500">{t('messages.conversations')}</h2>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            title={t('messages.new_chat')}
          >
            +
          </button>
        </div>

        {showNewChat && (
          <div className="border-b bg-indigo-50 p-2">
            <p className="text-xs text-indigo-600 font-medium mb-1">{t('messages.new_chat')}</p>
            {newChatContacts.length === 0 ? (
              <p className="text-xs text-gray-400">{t('messages.no_contacts')}</p>
            ) : (
              newChatContacts.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => startNewChat(c.id)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-indigo-100 rounded"
                >
                  {c.name} <span className="text-xs text-gray-400">({c.language})</span>
                </button>
              ))
            )}
          </div>
        )}

        {conversations.length === 0 && !showNewChat ? (
          <div className="p-3 text-xs text-gray-400 text-center">{t('messages.empty')}</div>
        ) : (
          conversations.map((c: any) => (
            <button
              key={c.user_id}
              onClick={() => setSelectedUser(c.user_id)}
              className={`w-full text-left p-3 hover:bg-gray-50 border-b ${selectedUser === c.user_id ? 'bg-indigo-50' : ''}`}
            >
              <p className="font-medium text-sm">{c.user_name}</p>
              {c.last_message && <p className="text-xs text-gray-400 truncate">{c.last_message}</p>}
            </button>
          ))
        )}
      </div>

      <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            {t('messages.select')}
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm">{selectedName}</span>
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
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('messages.placeholder')}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={!connected}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('messages.send')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
