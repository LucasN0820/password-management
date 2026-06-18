/**
 * Pure settings logic — no React, no native modules — so persistence merging
 * and preference resolution can be unit tested in isolation.
 */
import type { ColorSchemeName } from 'react-native';
import { DEFAULT_SETTINGS, type Settings, type ThemeMode } from './types';

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];
const LANGUAGES: Settings['language'][] = ['system', 'en', 'zh'];

/**
 * Validate and merge a raw, possibly-partial persisted blob onto the defaults.
 * Unknown or malformed fields fall back so a corrupt store never breaks startup.
 */
export function mergeStoredSettings(raw: unknown): Settings {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  const value = raw as Record<string, unknown>;
  return {
    themeMode: THEME_MODES.includes(value.themeMode as ThemeMode)
      ? (value.themeMode as ThemeMode)
      : DEFAULT_SETTINGS.themeMode,
    language: LANGUAGES.includes(value.language as Settings['language'])
      ? (value.language as Settings['language'])
      : DEFAULT_SETTINGS.language,
    appLockEnabled:
      typeof value.appLockEnabled === 'boolean'
        ? value.appLockEnabled
        : DEFAULT_SETTINGS.appLockEnabled,
    autoLockMs:
      typeof value.autoLockMs === 'number' && value.autoLockMs >= 0
        ? value.autoLockMs
        : DEFAULT_SETTINGS.autoLockMs,
    clipboardClearMs:
      typeof value.clipboardClearMs === 'number' && value.clipboardClearMs >= 0
        ? value.clipboardClearMs
        : DEFAULT_SETTINGS.clipboardClearMs,
  };
}

/** Map a theme preference to the value `Appearance.setColorScheme` expects. */
export function appearanceColorScheme(mode: ThemeMode): ColorSchemeName {
  return mode === 'system' ? 'unspecified' : mode;
}

/**
 * Resolve the language to apply at startup: an explicit user choice wins,
 * otherwise fall back to the detected device language.
 */
export function resolveInitialLanguage(
  preference: Settings['language'],
  deviceLanguage: string
): string {
  return preference === 'system' ? deviceLanguage : preference;
}
