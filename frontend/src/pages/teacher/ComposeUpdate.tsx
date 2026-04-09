import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { draftUpdate, sendUpdate } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

const YEAR_LEVELS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];
const SUBJECTS = ['', 'Mathematics', 'English', 'Science', 'HASS', 'The Arts'];

export default function ComposeUpdate({ user, classroomId }: { user: User; classroomId: string }) {
  const { t } = useTranslation(user.language);
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [yearLevel, setYearLevel] = useState('Year 3');
  const [subject, setSubject] = useState('');
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const res = await draftUpdate(notes, classroomId, yearLevel, subject || undefined);
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

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('compose.title')}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('compose.your_notes')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('compose.notes_help')}</p>

        {/* Curriculum parameters */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Year Level</label>
            <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className={inputCls}>
              {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Subject (optional)</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s || 'All subjects'}</option>)}
            </select>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('compose.placeholder')}
          className={`${inputCls} h-32 mb-3`}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !notes.trim()}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? t('compose.generating') : t('compose.generate')}
        </button>
      </div>

      {draft && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('compose.preview')}</h2>
            {draft.model_used && (
              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                {draft.model_used}
              </span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{t('compose.content_label')}</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm leading-relaxed">{draft.generated_content}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{t('compose.activities_label')}</h3>
            <ul className="list-disc list-inside text-gray-700 bg-gray-50 p-3 rounded text-sm space-y-1">
              {draft.home_activities?.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{t('compose.prompts_label')}</h3>
            <ul className="list-decimal list-inside text-gray-700 bg-gray-50 p-3 rounded text-sm space-y-1">
              {draft.guided_prompts?.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {sending ? t('compose.sending') : t('compose.send')}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 text-sm"
            >
              {t('compose.regenerate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
