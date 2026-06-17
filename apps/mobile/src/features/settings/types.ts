// Import defaults from pure constant modules (no native deps) so this file —
// and the pure logic that imports it — stays unit-testable under Node/vitest.
import { DEFAULT_CLIPBOARD_CLEAR_MS } from '../../lib/clipboard-config';
import { DEFAULT_AUTO_LOCK_MS } from '../app-lock/constants';

/** Appearance preference. `system` follows the OS setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Language preference. `system` follows the device locale. */
export type LanguagePreference = 'system' | 'en' | 'zh';

export interface Settings {
  themeMode: ThemeMode;
  language: LanguagePreference;
  appLockEnabled: boolean;
  autoLockMs: number;
  clipboardClearMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  language: 'system',
  appLockEnabled: true,
  autoLockMs: DEFAULT_AUTO_LOCK_MS,
  clipboardClearMs: DEFAULT_CLIPBOARD_CLEAR_MS,
};

/** Selectable auto-lock windows, in milliseconds. */
export const AUTO_LOCK_OPTIONS = [0, 30_000, 60_000, 300_000] as const;

/** Selectable clipboard-clear windows, in milliseconds (`0` = never). */
export const CLIPBOARD_CLEAR_OPTIONS = [15_000, 30_000, 60_000, 0] as const;
