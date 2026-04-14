export { default as i18n, supportedLanguages } from './config';
export type { SupportedLanguage } from './config';
export { useTranslation } from 'react-i18next';

import i18n from './config';

// Re-export changeLanguage for convenience
export const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
