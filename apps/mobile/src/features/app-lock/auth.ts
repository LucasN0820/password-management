/**
 * Thin wrapper around `expo-local-authentication`. Isolated here so the rest of
 * the feature (store, gate, logic) stays free of the native module and remains
 * unit-testable.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { i18n } from '@repo/i18n';

/**
 * Whether the device can authenticate the user at all. We accept either an
 * enrolled biometric (Face ID / fingerprint) or a device credential (PIN /
 * passcode / pattern). When nothing is enrolled we report `false` so the gate
 * stays open rather than locking the user out of their own vault.
 */
export async function getAuthSupport(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/**
 * Prompt for biometric authentication, falling back to the device credential
 * after failed biometric attempts (`disableDeviceFallback: false`).
 */
export async function authenticate(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: i18n.t('appLock.promptMessage'),
      cancelLabel: i18n.t('appLock.cancel'),
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
