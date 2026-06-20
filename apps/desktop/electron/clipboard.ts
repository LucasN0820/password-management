import { clipboard } from 'electron';

export const DEFAULT_CLIPBOARD_CLEAR_MS = 30_000;

let pendingClear: ReturnType<typeof setTimeout> | null = null;

/**
 * Clipboard data should only be cleared while it still matches the value this
 * app copied. A non-positive delay disables automatic clearing.
 */
export function shouldClearClipboard(
  current: string,
  expected: string,
  clearAfterMs: number
): boolean {
  return clearAfterMs > 0 && expected.length > 0 && current === expected;
}

/** Cancel the pending clear when a newer value replaces the copied secret. */
export function cancelScheduledClear(): void {
  if (pendingClear !== null) {
    clearTimeout(pendingClear);
    pendingClear = null;
  }
}

/**
 * Copy text and schedule a best-effort clear. The comparison at expiry keeps
 * content copied by the user in another application intact.
 */
export function copyToClipboard(
  text: string,
  clearAfterMs = DEFAULT_CLIPBOARD_CLEAR_MS
): void {
  cancelScheduledClear();
  clipboard.writeText(text);

  if (!shouldClearClipboard(text, text, clearAfterMs)) {
    return;
  }

  pendingClear = setTimeout(() => {
    pendingClear = null;

    try {
      if (shouldClearClipboard(clipboard.readText(), text, clearAfterMs)) {
        clipboard.clear();
      }
    } catch {
      // Clipboard access is best effort and must never crash the preload.
    }
  }, clearAfterMs);
}
