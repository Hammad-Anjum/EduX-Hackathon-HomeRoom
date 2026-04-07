import { useState, useEffect } from 'react';
import { askCurriculum, getCurriculumModels } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import TranslateButton from '../../components/TranslateButton';

interface User { id: string; name: string; role: string; language: string }

const SUGGESTED_KEYS = [
  'What should my Year 3 child know in maths?',
  'How is reading assessed in primary school?',
  'What is NAPLAN and how does it work?',
  'What does "developing" mean on a report card?',
  'How can I support my child with writing at home?',
  'What subjects does my child study in Year 3?',
];

interface ModelOption {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export default function CurriculumAsk({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [question, setQuestion] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [model, setModel] = useState('combined');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurriculumModels().then((res) => setModels(res.data));
  }, []);

  const handleAsk = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await askCurriculum(query, yearLevel || undefined, subject || undefined, user.language, model);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('curriculum.title')}</h1>
      <p className="text-gray-500 mb-6">{t('curriculum.subtitle')}</p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-2 mb-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder={t('curriculum.placeholder')}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? t('curriculum.thinking') : t('curriculum.ask')}
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            className="border rounded px-2 py-1 text-sm text-gray-600"
          >
            <option value="">{t('curriculum.any_year')}</option>
            <option value="Foundation Year">Foundation</option>
            {[1,2,3,4,5,6,7,8,9,10].map((y) => (
              <option key={y} value={`Year ${y}`}>Year {y}</option>
            ))}
          </select>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border rounded px-2 py-1 text-sm text-gray-600"
          >
            <option value="">{t('curriculum.any_subject')}</option>
            {['English', 'Mathematics', 'Science', 'HASS', 'Health and Physical Education', 'The Arts', 'Technologies'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Model picker */}
          <div className="flex items-center gap-1.5 ml-auto">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                disabled={!m.available}
                title={m.description}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  model === m.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : m.available
                      ? 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!result && !loading && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">{t('curriculum.suggested')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_KEYS.map((q, i) => (
              <button
                key={i}
                onClick={() => { setQuestion(q); handleAsk(q); }}
                className="text-left bg-white rounded-lg shadow p-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t('curriculum.answer')}</h2>
            {result.model_used && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                {result.model_used}
              </span>
            )}
          </div>
          <p className="text-gray-700">{result.answer}</p>
          <TranslateButton text={result.answer} targetLanguage={user.language} className="mb-4" />

          {result.sources?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('curriculum.sources')}</h3>
              <div className="space-y-1">
                {result.sources.map((s: any, i: number) => (
                  <p key={i} className="text-xs text-gray-400">
                    {s.model === 'curricullm' ? 'CurricuLLM API' : `${s.subject} - ${s.year_level} ${s.strand ? `(${s.strand})` : ''}`}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
