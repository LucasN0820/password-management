import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n, supportedLanguages, changeLanguage, detectAndSetLanguage } from '@repo/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    detectAndSetLanguage();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

// Re-export for convenience
export { supportedLanguages, changeLanguage };
