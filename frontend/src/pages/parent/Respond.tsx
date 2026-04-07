import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { respondToUpdate } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import TranslateButton from '../../components/TranslateButton';

interface User { id: string; name: string; role: string; language: string }

export default function Respond({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const { updateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const promptIndex = parseInt(searchParams.get('prompt') || '0');
  const promptText = searchParams.get('q') || 'How did your child go this week?';

  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const childMap: Record<string, string> = { p1: 's1', p2: 's2', p3: 's3' };
  const studentId = childMap[user.id] || 's1';

  const handleSubmit = async () => {
    if (!response.trim() || !updateId) return;
    setLoading(true);
    try {
      await respondToUpdate(updateId, {
        parent_id: user.id,
        student_id: studentId,
        prompt_index: promptIndex,
        response_text: response,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('respond.sent')}</h2>
        <p className="text-gray-500 mb-4">{t('respond.sent_desc')}</p>
        <button
          onClick={() => navigate('/parent/feed')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          {t('respond.back')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('respond.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-indigo-50 rounded-lg p-4 mb-4">
          <p className="text-indigo-700 font-medium">{promptText}</p>
          <TranslateButton text={promptText} targetLanguage={user.language} />
        </div>

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder={t('respond.placeholder')}
          className="w-full border rounded-lg p-3 h-32 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !response.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? t('respond.sending') : t('respond.send')}
          </button>
          <button
            onClick={() => navigate('/parent/feed')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            {t('respond.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
