/**
 * Pure decision logic for the app lock. Kept free of React and native modules
 * so the auto-lock timing rules can be unit tested in isolation.
 */

/** On a cold start, the vault is gated only when the feature is on and the
 * device can actually authenticate (otherwise we must not lock the user out). */
export function shouldLockOnLaunch(enabled: boolean, supported: boolean): boolean {
  return enabled && supported;
}

/**
 * When returning to the foreground, require re-authentication only if the app
 * sat in the background for at least the configured grace period. A `null`
 * timestamp means we never recorded a background transition, so don't prompt.
 */
export function shouldRequireAuth(params: {
  backgroundedAt: number | null;
  now: number;
  autoLockMs: number;
}): boolean {
  const { backgroundedAt, now, autoLockMs } = params;
  if (backgroundedAt === null) {
    return false;
  }
  return now - backgroundedAt >= autoLockMs;
}
