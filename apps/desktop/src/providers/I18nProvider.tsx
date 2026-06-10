import { type ReactNode , useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { changeLanguage, detectAndSetLanguage,i18n, supportedLanguages } from '@repo/i18n';
import { LanguageLoader } from '@repo/ui/primitives';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectAndSetLanguage()
      .then(() => { setReady(true); })
      .catch((error) => {
        console.error('Failed to detect/set language:', error);
        setReady(true); // Ensure app renders even if language detection fails
      });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {ready ? children : <LanguageLoader />}
    </I18nextProvider>
  );
}

// Re-export for convenience
export { changeLanguage,supportedLanguages };
