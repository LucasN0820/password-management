import { type ReactNode, useEffect } from 'react';
import { LanguageLoader } from '@/providers/LanguageLoader';
import { useSettingsStore } from './settings-store';

/**
 * Loads persisted settings once and applies them (theme, app-lock config,
 * clipboard delay) before rendering the app. Gating on `hydrated` prevents a
 * flash of the system theme and ensures the i18n provider — which mounts below
 * this one — can read the stored language preference synchronously.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const hydrated = useSettingsStore(s => s.hydrated);

  useEffect(() => {
    if (!hydrated) {
      void useSettingsStore.getState().hydrate();
    }
  }, [hydrated]);

  if (!hydrated) {
    return <LanguageLoader />;
  }
  return children;
}
