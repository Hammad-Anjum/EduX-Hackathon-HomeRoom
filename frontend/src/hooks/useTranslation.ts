import { useCallback } from 'react';
import translations from '../lib/i18n';

export function useTranslation(language: string) {
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations.en[key] || key;
    },
    [language]
  );

  return { t, language };
}
