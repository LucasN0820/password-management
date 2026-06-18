import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory fake of expo-clipboard so the auto-clear logic can be tested in Node.
let clipboard = '';
vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn(async (value: string) => {
    clipboard = value;
    return true;
  }),
  getStringAsync: vi.fn(async () => clipboard),
}));

import {
  cancelScheduledClear,
  copySensitive,
  DEFAULT_CLIPBOARD_CLEAR_MS,
  setClipboardClearMs,
  shouldClearClipboard,
} from '../clipboard';

describe('shouldClearClipboard', () => {
  it('clears only when the clipboard still holds the same non-empty secret', () => {
    expect(shouldClearClipboard('hunter2', 'hunter2')).toBe(true);
    expect(shouldClearClipboard('something-else', 'hunter2')).toBe(false);
    expect(shouldClearClipboard('', '')).toBe(false);
  });
});

describe('copySensitive', () => {
  beforeEach(() => {
    clipboard = '';
    cancelScheduledClear();
    setClipboardClearMs(DEFAULT_CLIPBOARD_CLEAR_MS);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cancelScheduledClear();
    vi.useRealTimers();
  });

  it('writes the secret to the clipboard immediately', async () => {
    await copySensitive('hunter2');
    expect(clipboard).toBe('hunter2');
  });

  it('wipes the secret after the clear delay', async () => {
    await copySensitive('hunter2', { clearAfterMs: 1000 });
    expect(clipboard).toBe('hunter2');
    await vi.advanceTimersByTimeAsync(1000);
    expect(clipboard).toBe('');
  });

  it('does not wipe content the user copied afterwards', async () => {
    await copySensitive('hunter2', { clearAfterMs: 1000 });
    clipboard = 'user-copied-this';
    await vi.advanceTimersByTimeAsync(1000);
    expect(clipboard).toBe('user-copied-this');
  });

  it('copying a new secret cancels the previous pending wipe', async () => {
    await copySensitive('first', { clearAfterMs: 1000 });
    await vi.advanceTimersByTimeAsync(600);
    await copySensitive('second', { clearAfterMs: 1000 });
    // The first secret's timer (at t=1000) must not fire and wipe "second".
    await vi.advanceTimersByTimeAsync(600);
    expect(clipboard).toBe('second');
    await vi.advanceTimersByTimeAsync(400);
    expect(clipboard).toBe('');
  });

  it('treats a non-positive delay as "never auto-clear"', async () => {
    await copySensitive('hunter2', { clearAfterMs: 0 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(clipboard).toBe('hunter2');
  });
});
