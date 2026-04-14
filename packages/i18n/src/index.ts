import i18n, { supportedLanguages, resources } from './config';
export { i18n, supportedLanguages, resources };
export type { SupportedLanguage } from './config';
export { useTranslation } from 'react-i18next';

// Re-export changeLanguage for convenience
export const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

/**
 * Detects the user's preferred language and sets it in i18n.
 * For browser: checks localStorage first, then navigator.language
 * For mobile/non-browser: uses navigator.language or defaults to 'en'
 */
export const detectAndSetLanguage = async () => {
  const isBrowser = typeof window !== 'undefined';

  // Check localStorage first (user preference) - browser only
  if (isBrowser) {
    const stored = localStorage.getItem('language');
    if (stored && supportedLanguages.includes(stored as typeof supportedLanguages[number])) {
      await i18n.changeLanguage(stored);
      return;
    }
  }

  // Fallback to device/browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    // Handle zh-CN, zh-TW, en-US formats
    const lang = navigator.language.split('-')[0];
    // zh cases map to 'zh', others to 'en'
    const mappedLang = supportedLanguages.includes(lang as typeof supportedLanguages[number])
      ? lang
      : 'en';
    await i18n.changeLanguage(mappedLang);
    return;
  }

  // Default to English
  await i18n.changeLanguage('en');
};

/**
 * Get current language from localStorage or device
 */
export const getStoredLanguage = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language');
  }
  return null;
};

/**
 * Store language preference to localStorage
 */
export const storeLanguage = (lng: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
  }
};
