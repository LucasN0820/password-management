import { describe, expect, it } from 'vitest';
import { DEFAULT_AUTO_LOCK_MS } from '../constants';
import { shouldLockOnLaunch, shouldRequireAuth } from '../logic';

describe('shouldLockOnLaunch', () => {
  it('locks only when the feature is enabled and the device can authenticate', () => {
    expect(shouldLockOnLaunch(true, true)).toBe(true);
    expect(shouldLockOnLaunch(true, false)).toBe(false);
    expect(shouldLockOnLaunch(false, true)).toBe(false);
    expect(shouldLockOnLaunch(false, false)).toBe(false);
  });
});

describe('shouldRequireAuth', () => {
  const autoLockMs = DEFAULT_AUTO_LOCK_MS;

  it('never prompts when no background transition was recorded', () => {
    expect(
      shouldRequireAuth({ backgroundedAt: null, now: 10_000_000, autoLockMs })
    ).toBe(false);
  });

  it('does not prompt within the grace window', () => {
    const backgroundedAt = 1_000_000;
    expect(
      shouldRequireAuth({
        backgroundedAt,
        now: backgroundedAt + autoLockMs - 1,
        autoLockMs,
      })
    ).toBe(false);
  });

  it('prompts exactly at the grace boundary', () => {
    const backgroundedAt = 1_000_000;
    expect(
      shouldRequireAuth({
        backgroundedAt,
        now: backgroundedAt + autoLockMs,
        autoLockMs,
      })
    ).toBe(true);
  });

  it('prompts after the grace window elapses', () => {
    const backgroundedAt = 1_000_000;
    expect(
      shouldRequireAuth({
        backgroundedAt,
        now: backgroundedAt + autoLockMs + 5_000,
        autoLockMs,
      })
    ).toBe(true);
  });

  it('honors a custom (shorter) auto-lock window', () => {
    const backgroundedAt = 0;
    expect(
      shouldRequireAuth({ backgroundedAt, now: 4_999, autoLockMs: 5_000 })
    ).toBe(false);
    expect(
      shouldRequireAuth({ backgroundedAt, now: 5_000, autoLockMs: 5_000 })
    ).toBe(true);
  });
});
