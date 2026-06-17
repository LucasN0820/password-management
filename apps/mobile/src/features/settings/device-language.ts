import * as Localization from 'expo-localization';
import { supportedLanguages } from '@repo/i18n';

/**
 * The device's primary language mapped to a supported language code, defaulting
 * to English when the locale is unsupported.
 */
export function getDeviceLanguage(): string {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  if (
    code &&
    supportedLanguages.includes(code as (typeof supportedLanguages)[number])
  ) {
    return code;
  }
  return 'en';
}
