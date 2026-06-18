/** Default grace period before a backgrounded app demands re-authentication. */
export const DEFAULT_AUTO_LOCK_MS = 60_000;

export interface AppLockConfig {
  /** Whether the biometric/device-credential gate is active at all. */
  enabled: boolean;
  /** How long the app may sit in the background before it re-locks (ms). */
  autoLockMs: number;
}

export const DEFAULT_APP_LOCK_CONFIG: AppLockConfig = {
  enabled: true,
  autoLockMs: DEFAULT_AUTO_LOCK_MS,
};
