import i18n, { supportedLanguages, resources } from './config';
export { i18n, supportedLanguages, resources };
export type { SupportedLanguage } from './config';
export { useTranslation } from 'react-i18next';

// Re-export changeLanguage for convenience
export const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
