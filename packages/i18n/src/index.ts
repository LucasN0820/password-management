import i18n, { supportedLanguages, resources } from './config';
export { i18n, supportedLanguages, resources };
export type { SupportedLanguage } from './config';
export { useTranslation } from 'react-i18next';

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// Auto-persist language preference when language changes
i18n.on('languageChanged', lng => {
  getBrowserStorage()?.setItem('language', lng);
});

// Re-export changeLanguage for convenience
export const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

/**
 * Detects the user's preferred language and sets it in i18n.
 * For browser: checks localStorage first, then navigator.language
 * For browser (e.g., web workers): uses navigator.language if available
 * Note: React Native mobile app uses its own provider with expo-localization
 */
export const detectAndSetLanguage = async () => {
  try {
    const isBrowser = typeof window !== 'undefined';

    // Check localStorage first (user preference) - browser only
    if (isBrowser) {
      const stored = getBrowserStorage()?.getItem('language');
      if (
        stored &&
        supportedLanguages.includes(
          stored as (typeof supportedLanguages)[number]
        )
      ) {
        await i18n.changeLanguage(stored);
        return;
      }
    }

    // Fallback to device/browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      // Handle zh-CN, zh-TW, en-US formats
      const lang = navigator.language.split('-')[0];
      // zh cases map to 'zh', others to 'en'
      const mappedLang = supportedLanguages.includes(
        lang as (typeof supportedLanguages)[number]
      )
        ? lang
        : 'en';
      await i18n.changeLanguage(mappedLang);
      return;
    }

    // Default to English
    await i18n.changeLanguage('en');
  } catch (error) {
    console.error('Failed to detect/set language:', error);
    // Ensure we always have a language set even on error
    await i18n.changeLanguage('en');
  }
};

/**
 * Get current language from localStorage or device
 */
export const getStoredLanguage = (): string | null => {
  return getBrowserStorage()?.getItem('language') ?? null;
};

/**
 * Store language preference to localStorage
 */
export const storeLanguage = (lng: string) => {
  getBrowserStorage()?.setItem('language', lng);
};
