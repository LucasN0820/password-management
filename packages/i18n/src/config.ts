import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

export const resources = {
  en: { translation: en },
  zh: { translation: zh },
} as const;

export const supportedLanguages = ['en', 'zh'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    // Check localStorage first (user preference)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language');
      if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
        callback(stored);
        return;
      }
    }

    // Fallback to browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0] || 'en';
      if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
        callback(browserLang);
        return;
      }
    }

    // Default to English
    callback('en');
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lng);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
