import { useState } from 'react';
import { translateText } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';

interface TranslateButtonProps {
  text: string;
  targetLanguage: string;
  className?: string;
}

export default function TranslateButton({ text, targetLanguage, className = '' }: TranslateButtonProps) {
  const { t } = useTranslation(targetLanguage);
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleTranslate = async () => {
    if (translated) {
      setVisible(!visible);
      return;
    }
    setLoading(true);
    try {
      const res = await translateText(text, targetLanguage);
      setTranslated(res.data.translated_text);
      setVisible(true);
    } catch {
      setTranslated(t('translate.failed'));
      setVisible(true);
    }
    setLoading(false);
  };

  return (
    <div className={className}>
      <button
        onClick={handleTranslate}
        className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {loading ? t('translate.loading') : visible ? t('translate.hide') : t('translate.show')}
      </button>
      {visible && translated && (
        <p className="text-sm text-gray-500 mt-1 italic bg-gray-50 rounded px-2 py-1">
          {translated}
        </p>
      )}
    </div>
  );
}
