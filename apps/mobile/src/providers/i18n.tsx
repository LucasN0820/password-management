import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { changeLanguage, i18n, supportedLanguages } from '@repo/i18n';
import { getDeviceLanguage } from '@/features/settings/device-language';
import { resolveInitialLanguage } from '@/features/settings/logic';
import { useSettingsStore } from '@/features/settings/settings-store';
import { LanguageLoader } from './LanguageLoader';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // SettingsProvider mounts above this one and has already hydrated, so the
    // stored language preference (if any) wins; otherwise fall back to device.
    const preference = useSettingsStore.getState().language;
    const lang = resolveInitialLanguage(preference, getDeviceLanguage());
    changeLanguage(lang)
      .then(() => setReady(true))
      .catch(error => {
        console.error('Failed to change language:', error);
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
export { changeLanguage,supportedLanguages };
