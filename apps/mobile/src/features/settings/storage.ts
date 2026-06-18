/**
 * Persistence for user settings. These are non-secret preferences, but the app
 * already depends on `expo-secure-store`, so we reuse it rather than pulling in
 * AsyncStorage for a single small JSON blob.
 */
import * as SecureStore from 'expo-secure-store';
import { mergeStoredSettings } from './logic';
import type { Settings } from './types';

const SETTINGS_STORAGE_KEY = 'password-management.settings.v1';

/** Load persisted settings, merged onto defaults. Never throws. */
export async function loadStoredSettings(): Promise<Settings> {
  try {
    const raw = await SecureStore.getItemAsync(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return mergeStoredSettings(null);
    }
    return mergeStoredSettings(JSON.parse(raw));
  } catch {
    return mergeStoredSettings(null);
  }
}

/** Persist the full settings object. Best-effort; failures are swallowed. */
export async function persistSettings(settings: Settings): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore write failures — the in-memory store stays authoritative.
  }
}
