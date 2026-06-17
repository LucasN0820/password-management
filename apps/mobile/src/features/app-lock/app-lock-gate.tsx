import { type ReactNode, useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useAppLockStore } from './app-lock-store';
import { LockScreen } from './lock-screen';
import { PrivacyCover } from './privacy-cover';

/**
 * Wraps the app content and gates it behind biometric or device-credential
 * authentication. Content stays mounted underneath the overlay so unlocking
 * preserves navigation state. Overlay precedence is: the privacy cover while
 * the support check is pending, then the lock screen while authentication is
 * required, then the privacy cover again while backgrounded within the grace
 * window.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const ready = useAppLockStore(s => s.ready);
  const locked = useAppLockStore(s => s.locked);
  const covered = useAppLockStore(s => s.covered);

  // Run the support check once, then prompt immediately if we start out locked.
  useEffect(() => {
    let active = true;
    void (async () => {
      const store = useAppLockStore.getState();
      await store.initialize();
      if (active && useAppLockStore.getState().locked) {
        await store.authenticate();
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Drive the auto-lock window from foreground/background transitions.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const store = useAppLockStore.getState();
      if (nextState === 'active') {
        void store.handleForeground();
      } else {
        // 'inactive' (iOS app-switcher / control center) and 'background'.
        store.handleBackground();
      }
    });
    return () => subscription.remove();
  }, []);

  let overlay: ReactNode = null;
  if (!ready) {
    overlay = <PrivacyCover />;
  } else if (locked) {
    overlay = <LockScreen />;
  } else if (covered) {
    overlay = <PrivacyCover />;
  }

  return (
    <View style={styles.root}>
      {children}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
