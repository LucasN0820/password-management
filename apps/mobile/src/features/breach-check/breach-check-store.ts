import { create } from 'zustand';
import { type BreachLookup, lookupPassword } from './client';
import { scanVault } from './scan';
import {
  loadBreachCheckEnabled,
  persistBreachCheckEnabled,
} from './storage';

export type BreachScanStatus = 'idle' | 'scanning' | 'done' | 'partial';

interface BreachCheckState {
  /** Opt-in flag. Default OFF — the only check that touches the network. */
  enabled: boolean;
  /** Persisted flag has been loaded. */
  hydrated: boolean;
  status: BreachScanStatus;
  /** Breach count keyed by password id (only breached entries are present). */
  counts: Record<number, number>;
  /** Ids of breached entries, in scan order. */
  breachedIds: number[];

  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  /** Run a scan over the given entries. No-op (and clears) when disabled. */
  scan: (
    entries: { id: number; password: string }[]
  ) => Promise<void>;
  /** Drop cached range responses to force a fresh fetch. */
  clearCache: () => void;
}

/**
 * Range-response cache shared across scans for the lifetime of the store, keyed
 * by 5-char hash prefix. Lives outside zustand state so updates never trigger
 * re-renders.
 */
const prefixCache = new Map<string, string>();

export const useBreachCheckStore = create<BreachCheckState>((set, get) => ({
  enabled: false,
  hydrated: false,
  status: 'idle',
  counts: {},
  breachedIds: [],

  hydrate: async () => {
    const enabled = await loadBreachCheckEnabled();
    set({ enabled, hydrated: true });
  },

  setEnabled: enabled => {
    void persistBreachCheckEnabled(enabled);
    if (enabled) {
      set({ enabled });
    } else {
      // Turning off clears any previously surfaced breach results immediately.
      set({ enabled, status: 'idle', counts: {}, breachedIds: [] });
    }
  },

  scan: async entries => {
    if (!get().enabled) {
      set({ status: 'idle', counts: {}, breachedIds: [] });
      return;
    }
    set({ status: 'scanning' });
    const lookup = (password: string): Promise<BreachLookup> =>
      lookupPassword(password, prefixCache);
    const result = await scanVault(entries, lookup);
    set({
      counts: result.counts,
      breachedIds: result.breached.map(e => e.id),
      status: result.partial ? 'partial' : 'done',
    });
  },

  clearCache: () => {
    prefixCache.clear();
  },
}));
