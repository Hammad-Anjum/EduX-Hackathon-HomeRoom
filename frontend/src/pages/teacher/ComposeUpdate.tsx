import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { draftUpdate, sendUpdate } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

export default function ComposeUpdate({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const res = await draftUpdate(notes, 'c1');
      setDraft(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!draft) return;
    setSending(true);
    try {
      await sendUpdate(draft.id);
      navigate('/teacher/dashboard');
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('compose.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('compose.your_notes')}</h2>
        <p className="text-sm text-gray-500 mb-3">{t('compose.notes_help')}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('compose.placeholder')}
          className="w-full border rounded-lg p-3 h-32 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !notes.trim()}
          className="mt-3 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? t('compose.generating') : t('compose.generate')}
        </button>
      </div>

      {draft && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('compose.preview')}</h2>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{t('compose.content_label')}</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{draft.generated_content}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{t('compose.activities_label')}</h3>
            <ul className="list-disc list-inside text-gray-700 bg-gray-50 p-3 rounded">
              {draft.home_activities?.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{t('compose.prompts_label')}</h3>
            <ul className="list-decimal list-inside text-gray-700 bg-gray-50 p-3 rounded">
              {draft.guided_prompts?.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? t('compose.sending') : t('compose.send')}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              {t('compose.regenerate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
