import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clipboardMock = vi.hoisted(() => {
  return {
    current: '',
    clear: vi.fn(() => {
      clipboardMock.current = '';
    }),
    readText: vi.fn(() => clipboardMock.current),
    writeText: vi.fn((text: string) => {
      clipboardMock.current = text;
    }),
  };
});

vi.mock('electron', () => ({ clipboard: clipboardMock }));

// The import must follow the hoisted Electron mock for this module-level singleton.
// eslint-disable-next-line import/first
import {
  cancelScheduledClear,
  copyToClipboard,
  DEFAULT_CLIPBOARD_CLEAR_MS,
  shouldClearClipboard,
} from '../clipboard';

describe('clipboard auto-clear', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clipboardMock.current = '';
    clipboardMock.clear.mockClear();
    clipboardMock.readText.mockClear();
    clipboardMock.writeText.mockClear();
    cancelScheduledClear();
  });

  afterEach(() => {
    cancelScheduledClear();
    vi.useRealTimers();
  });

  it('only clears the expected non-empty value when clearing is enabled', () => {
    expect(shouldClearClipboard('secret', 'secret', 1)).toBe(true);
    expect(shouldClearClipboard('new value', 'secret', 1)).toBe(false);
    expect(shouldClearClipboard('', '', 1)).toBe(false);
    expect(shouldClearClipboard('secret', 'secret', 0)).toBe(false);
    expect(shouldClearClipboard('secret', 'secret', -1)).toBe(false);
  });

  it('writes immediately and clears the matching value at expiry', () => {
    copyToClipboard('secret', 1_000);

    expect(clipboardMock.current).toBe('secret');
    expect(clipboardMock.clear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);

    expect(clipboardMock.clear).toHaveBeenCalledOnce();
    expect(clipboardMock.current).toBe('');
  });

  it('uses the 30 second default delay', () => {
    copyToClipboard('secret');

    vi.advanceTimersByTime(DEFAULT_CLIPBOARD_CLEAR_MS - 1);
    expect(clipboardMock.clear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(clipboardMock.clear).toHaveBeenCalledOnce();
  });

  it('preserves content copied elsewhere before expiry', () => {
    copyToClipboard('secret', 1_000);
    clipboardMock.current = 'something else';

    vi.advanceTimersByTime(1_000);

    expect(clipboardMock.clear).not.toHaveBeenCalled();
    expect(clipboardMock.current).toBe('something else');
  });

  it('cancels the old timer when a new value is copied', () => {
    copyToClipboard('old secret', 1_000);
    vi.advanceTimersByTime(500);
    copyToClipboard('new secret', 1_000);

    vi.advanceTimersByTime(500);
    expect(clipboardMock.clear).not.toHaveBeenCalled();
    expect(clipboardMock.current).toBe('new secret');

    vi.advanceTimersByTime(500);
    expect(clipboardMock.clear).toHaveBeenCalledOnce();
  });

  it('does not schedule clearing for a non-positive delay', () => {
    copyToClipboard('keep me', 0);
    vi.runAllTimers();

    expect(clipboardMock.current).toBe('keep me');
    expect(clipboardMock.readText).not.toHaveBeenCalled();
    expect(clipboardMock.clear).not.toHaveBeenCalled();
  });
});
