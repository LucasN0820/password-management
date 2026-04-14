import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n, supportedLanguages, changeLanguage, detectAndSetLanguage } from '@repo/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectAndSetLanguage().then(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

// Re-export for convenience
export { supportedLanguages, changeLanguage };
