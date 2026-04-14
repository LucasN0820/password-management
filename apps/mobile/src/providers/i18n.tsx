import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import * as Localization from 'expo-localization';
import { i18n, supportedLanguages, changeLanguage } from '@repo/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
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
    i18n.changeLanguage(deviceLang).then(() => setReady(true));
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
