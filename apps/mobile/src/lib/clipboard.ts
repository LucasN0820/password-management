/**
 * Clipboard helpers for sensitive values (passwords, TOTP codes…).
 *
 * Copying a secret to the clipboard leaves it readable by any other app until
 * it is overwritten. `copySensitive` copies the value and schedules an
 * automatic wipe, but only clears the clipboard if it still holds the same
 * secret — so it never deletes something the user copied afterwards.
 */
import * as Clipboard from 'expo-clipboard';
import { DEFAULT_CLIPBOARD_CLEAR_MS } from './clipboard-config';

export { DEFAULT_CLIPBOARD_CLEAR_MS };

let clearDelayMs = DEFAULT_CLIPBOARD_CLEAR_MS;
let pendingClear: ReturnType<typeof setTimeout> | null = null;

/** Override the auto-clear delay (wired from settings — see task 0004). */
export function setClipboardClearMs(ms: number) {
  clearDelayMs = ms;
}

/**
 * Pure rule: clear only when the clipboard still holds exactly the secret we
 * wrote. A non-empty diff means the user copied something else in the meantime.
 */
export function shouldClearClipboard(
  current: string,
  expected: string
): boolean {
  return current === expected && expected.length > 0;
}

/** Cancel any pending auto-clear, for instance when a newer secret is copied. */
export function cancelScheduledClear() {
  if (pendingClear) {
    clearTimeout(pendingClear);
    pendingClear = null;
  }
}

function scheduleClear(expected: string, ms: number) {
  cancelScheduledClear();
  if (ms <= 0) {
    return;
  }
  pendingClear = setTimeout(() => {
    pendingClear = null;
    void (async () => {
      try {
        const current = await Clipboard.getStringAsync();
        if (shouldClearClipboard(current, expected)) {
          await Clipboard.setStringAsync('');
        }
      } catch {
        // Best-effort wipe; ignore clipboard read/write failures.
      }
    })();
  }, ms);
}

/**
 * Copy a secret to the clipboard and schedule it to be wiped after
 * `clearAfterMs` (defaults to the configured delay).
 */
export async function copySensitive(
  text: string,
  options?: { clearAfterMs?: number }
) {
  await Clipboard.setStringAsync(text);
  scheduleClear(text, options?.clearAfterMs ?? clearDelayMs);
}
