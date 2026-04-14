import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import * as Localization from 'expo-localization';
import { LanguageLoader } from './LanguageLoader';
import { i18n, supportedLanguages, changeLanguage } from '@repo/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Get the device's primary language code using expo-localization.
 * Returns 'en' or 'zh' based on supported languages.
 */
const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  const primaryLocale = locales[0];

  if (primaryLocale?.languageCode) {
    const langCode = primaryLocale.languageCode.toLowerCase();
    // Map to supported languages
    if (supportedLanguages.includes(langCode as typeof supportedLanguages[number])) {
      return langCode;
    }
  }

  return 'en';
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const deviceLang = getDeviceLanguage();
    changeLanguage(deviceLang)
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Failed to change language:', err);
        setReady(true); // Ensure app renders even if language fails
      });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {ready ? children : <LanguageLoader />}
    </I18nextProvider>
  );
}

// Re-export for convenience
export { supportedLanguages, changeLanguage };
