import { describe, expect, it } from 'vitest';
import {
  appearanceColorScheme,
  mergeStoredSettings,
  resolveInitialLanguage,
} from '../logic';
import { DEFAULT_SETTINGS } from '../types';

describe('mergeStoredSettings', () => {
  it('returns defaults for null / non-object input', () => {
    expect(mergeStoredSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeStoredSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(mergeStoredSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and falls back on invalid ones', () => {
    const merged = mergeStoredSettings({
      themeMode: 'dark',
      language: 'zh',
      appLockEnabled: false,
      autoLockMs: 5000,
      clipboardClearMs: 0,
    });
    expect(merged).toEqual({
      themeMode: 'dark',
      language: 'zh',
      appLockEnabled: false,
      autoLockMs: 5000,
      clipboardClearMs: 0,
    });
  });

  it('rejects unknown enums and negative durations', () => {
    const merged = mergeStoredSettings({
      themeMode: 'sepia',
      language: 'fr',
      appLockEnabled: 'yes',
      autoLockMs: -1,
      clipboardClearMs: 'soon',
    });
    expect(merged).toEqual(DEFAULT_SETTINGS);
  });

  it('merges partial input onto defaults', () => {
    const merged = mergeStoredSettings({ themeMode: 'light' });
    expect(merged.themeMode).toBe('light');
    expect(merged.language).toBe(DEFAULT_SETTINGS.language);
    expect(merged.autoLockMs).toBe(DEFAULT_SETTINGS.autoLockMs);
  });
});

describe('appearanceColorScheme', () => {
  it('maps system to "unspecified" and passes light/dark through', () => {
    expect(appearanceColorScheme('system')).toBe('unspecified');
    expect(appearanceColorScheme('light')).toBe('light');
    expect(appearanceColorScheme('dark')).toBe('dark');
  });
});

describe('resolveInitialLanguage', () => {
  it('uses the device language when preference is system', () => {
    expect(resolveInitialLanguage('system', 'zh')).toBe('zh');
    expect(resolveInitialLanguage('system', 'en')).toBe('en');
  });

  it('uses the explicit preference when set', () => {
    expect(resolveInitialLanguage('en', 'zh')).toBe('en');
    expect(resolveInitialLanguage('zh', 'en')).toBe('zh');
  });
});
