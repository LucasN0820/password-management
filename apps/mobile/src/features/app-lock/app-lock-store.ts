import { create } from 'zustand';
import { authenticate as nativeAuthenticate, getAuthSupport } from './auth';
import {
  type AppLockConfig,
  DEFAULT_APP_LOCK_CONFIG,
} from './constants';
import { shouldLockOnLaunch, shouldRequireAuth } from './logic';

interface AppLockState extends AppLockConfig {
  /** Device support check has completed. Until then we keep the vault covered. */
  ready: boolean;
  /** True when the device has an enrolled biometric or device credential. */
  supported: boolean;
  /** The gate currently requires successful authentication to proceed. */
  locked: boolean;
  /** A transient privacy cover shown while backgrounded that needs no auth. */
  covered: boolean;
  /** When the app last went to the background, used for the auto-lock window. */
  backgroundedAt: number | null;

  initialize: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  handleBackground: () => void;
  handleForeground: () => Promise<void>;
  setConfig: (config: Partial<AppLockConfig>) => void;
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  ...DEFAULT_APP_LOCK_CONFIG,
  ready: false,
  supported: false,
  // Assume locked until the support check proves otherwise — this prevents the
  // vault contents from flashing on a cold start before `initialize` resolves.
  locked: true,
  covered: false,
  backgroundedAt: null,

  initialize: async () => {
    const supported = await getAuthSupport();
    const locked = shouldLockOnLaunch(get().enabled, supported);
    set({ supported, ready: true, locked });
  },

  authenticate: async () => {
    const { enabled, supported } = get();
    // Nothing to unlock — open the gate so the app is never bricked.
    if (!enabled || !supported) {
      set({ locked: false, covered: false, backgroundedAt: null });
      return true;
    }
    const success = await nativeAuthenticate();
    if (success) {
      set({ locked: false, covered: false, backgroundedAt: null });
    }
    return success;
  },

  handleBackground: () => {
    const { enabled, supported } = get();
    if (!enabled || !supported) {
      return;
    }
    // Cover immediately so the OS app-switcher snapshot can't leak the vault,
    // and start the auto-lock clock.
    set({ covered: true, backgroundedAt: Date.now() });
  },

  handleForeground: async () => {
    const { enabled, supported, backgroundedAt, autoLockMs } = get();
    if (!enabled || !supported) {
      set({ covered: false });
      return;
    }
    const requireAuth = shouldRequireAuth({
      backgroundedAt,
      now: Date.now(),
      autoLockMs,
    });
    if (requireAuth) {
      set({ locked: true });
      await get().authenticate();
    } else {
      // Within the grace window — drop the cover without prompting.
      set({ covered: false, backgroundedAt: null });
    }
  },

  setConfig: config => {
    set(config);
    // Turning the lock off mid-session should release the gate immediately.
    if (config.enabled === false) {
      set({ locked: false, covered: false, backgroundedAt: null });
    }
  },
}));
