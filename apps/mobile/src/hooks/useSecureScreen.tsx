import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from 'expo-screen-capture';
import { useEffect } from 'react';

/**
 * Marks the current screen as secure while it is mounted.
 *
 * On Android this sets `FLAG_SECURE`, which blocks screenshots/recording and
 * hides the screen from the recents/app-switcher snapshot. On iOS screenshots
 * cannot be blocked (the app-switcher snapshot is handled separately by the app
 * lock's privacy cover), so this is effectively a no-op there.
 *
 * A unique `key` keeps concurrent secure screens from cancelling each other —
 * capture is only re-allowed once every holder of that key has released it.
 */
export function useSecureScreen(key: string) {
  useEffect(() => {
    void preventScreenCaptureAsync(key);
    return () => {
      void allowScreenCaptureAsync(key);
    };
  }, [key]);
}
