import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n, supportedLanguages, changeLanguage } from '@repo/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Initialize language on mount (language detector runs in i18next init)
    // This ensures the language is ready before rendering children
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

// Re-export for convenience
export { supportedLanguages, changeLanguage };
