import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_FEEDBACK_MS = 1_500;

interface ClipboardCopyOptions {
  clearAfterMs?: number;
}

export function useCopyToClipboard(feedbackMs = DEFAULT_FEEDBACK_MS) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = useCallback(
    async (text: string, key = 'default', options?: ClipboardCopyOptions) => {
      await window.electronAPI.copyToClipboard(text, options);
      setCopiedKey(key);

      if (feedbackTimer.current !== null) {
        clearTimeout(feedbackTimer.current);
      }
      feedbackTimer.current = setTimeout(() => {
        feedbackTimer.current = null;
        setCopiedKey(null);
      }, feedbackMs);
    },
    [feedbackMs]
  );

  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== null) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  return { copiedKey, copyToClipboard };
}
