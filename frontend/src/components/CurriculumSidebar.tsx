import { useState } from 'react';
import { askCurriculum } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';
import TranslateButton from './TranslateButton';

interface Props {
  userLanguage: string;
}

export default function CurriculumSidebar({ userLanguage }: Props) {
  const { t } = useTranslation(userLanguage);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleAsk = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await askCurriculum(query, undefined, undefined, userLanguage, 'combined');
      setResult(res.data);
    } catch { /* silent */ }
    setLoading(false);
  };

  const quickQuestions = [
    'What should Year 3 know in maths?',
    'How is reading assessed?',
    'What is NAPLAN?',
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-110 transition-transform"
        style={{ zIndex: 9999 }}
        title={t('curriculum.title')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed right-6 bottom-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[70vh]" style={{ zIndex: 9999 }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-indigo-600 text-white rounded-t-xl">
        <span className="text-sm font-semibold">{t('curriculum.title')}</span>
        <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!result && !loading && (
          <div className="space-y-1.5">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => { setQuestion(q); handleAsk(q); }}
                className="w-full text-left text-xs bg-gray-50 rounded-lg p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="text-xs text-gray-400 text-center py-4">{t('curriculum.thinking')}</p>}

        {result && (
          <div>
            <p className="text-xs text-gray-700 leading-relaxed">{result.answer}</p>
            <TranslateButton text={result.answer} targetLanguage={userLanguage} />
            {result.model_used && (
              <span className="text-[10px] text-gray-400 mt-1 block">{result.model_used}</span>
            )}
            <button
              onClick={() => { setResult(null); setQuestion(''); }}
              className="text-xs text-indigo-600 hover:underline mt-2"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-1.5">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder={t('curriculum.placeholder')}
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50"
        >
          {t('curriculum.ask')}
        </button>
      </div>
    </div>
  );
}
