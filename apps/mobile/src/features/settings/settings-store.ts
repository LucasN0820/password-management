import { Appearance } from 'react-native';
import { create } from 'zustand';
import { changeLanguage } from '@repo/i18n';
import { useAppLockStore } from '@/features/app-lock';
import { setClipboardClearMs } from '@/lib/clipboard';
import { appearanceColorScheme } from './logic';
import { loadStoredSettings, persistSettings } from './storage';
import {
  DEFAULT_SETTINGS,
  type LanguagePreference,
  type Settings,
  type ThemeMode,
} from './types';

interface SettingsState extends Settings {
  /** Persisted settings have been loaded and applied. */
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: LanguagePreference, deviceLanguage: string) => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setAutoLockMs: (ms: number) => void;
  setClipboardClearMs: (ms: number) => void;
}

/** Persist the current settings slice without blocking the caller. */
function save(get: () => SettingsState) {
  const { themeMode, language, appLockEnabled, autoLockMs, clipboardClearMs } =
    get();
  void persistSettings({
    themeMode,
    language,
    appLockEnabled,
    autoLockMs,
    clipboardClearMs,
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const settings = await loadStoredSettings();
    // Apply non-language side effects up front; language is owned by the i18n
    // provider, which reads `language` from this store once it is hydrated.
    Appearance.setColorScheme(appearanceColorScheme(settings.themeMode));
    useAppLockStore.getState().setConfig({
      enabled: settings.appLockEnabled,
      autoLockMs: settings.autoLockMs,
    });
    setClipboardClearMs(settings.clipboardClearMs);
    set({ ...settings, hydrated: true });
  },

  setThemeMode: mode => {
    Appearance.setColorScheme(appearanceColorScheme(mode));
    set({ themeMode: mode });
    save(get);
  },

  setLanguage: (language, deviceLanguage) => {
    void changeLanguage(language === 'system' ? deviceLanguage : language);
    set({ language });
    save(get);
  },

  setAppLockEnabled: enabled => {
    useAppLockStore.getState().setConfig({ enabled });
    set({ appLockEnabled: enabled });
    save(get);
  },

  setAutoLockMs: ms => {
    useAppLockStore.getState().setConfig({ autoLockMs: ms });
    set({ autoLockMs: ms });
    save(get);
  },

  setClipboardClearMs: ms => {
    setClipboardClearMs(ms);
    set({ clipboardClearMs: ms });
    save(get);
  },
}));
