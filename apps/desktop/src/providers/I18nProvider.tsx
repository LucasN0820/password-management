import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { LanguageLoader } from '@repo/ui/primitives';
import { i18n, supportedLanguages, changeLanguage, detectAndSetLanguage } from '@repo/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectAndSetLanguage()
      .then(() => setReady(true))
      .catch(console.error);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {ready ? children : <LanguageLoader variant="desktop" />}
    </I18nextProvider>
  );
}

// Re-export for convenience
export { supportedLanguages, changeLanguage };
