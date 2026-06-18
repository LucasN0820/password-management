/**
 * Persistence for the breach-check opt-in flag. This is the ONLY user-facing
 * setting this feature owns; it lives in its own SecureStore key (separate from
 * the main settings blob owned by another module) so the two never contend.
 *
 * The flag is non-secret, but the app already depends on `expo-secure-store`,
 * so we reuse it rather than pulling in another storage dependency.
 */
import * as SecureStore from 'expo-secure-store';

const BREACH_CHECK_STORAGE_KEY = 'password-management.breach-check.v1';

/** Load the persisted opt-in flag. Defaults to OFF and never throws. */
export async function loadBreachCheckEnabled(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(BREACH_CHECK_STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

/** Persist the opt-in flag. Best-effort; failures are swallowed. */
export async function persistBreachCheckEnabled(
  enabled: boolean
): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      BREACH_CHECK_STORAGE_KEY,
      enabled ? 'true' : 'false'
    );
  } catch {
    // Ignore write failures — the in-memory store stays authoritative.
  }
}
