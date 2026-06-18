import { create } from 'zustand';
import type { Password } from '@repo/db';

interface UndoDeleteState {
  /** The most recently deleted password, awaiting an optional undo. */
  deleted: Password | null;
  /** Bumped on each delete so re-showing restarts the snackbar timer. */
  nonce: number;
  show: (password: Password) => void;
  dismiss: () => void;
}

/**
 * Holds the last deleted password so the root-mounted snackbar can offer
 * "Undo". The row is already removed from the DB — undo re-inserts it (with a
 * new id), which is acceptable for an accidental-deletion safety net.
 */
export const useUndoDeleteStore = create<UndoDeleteState>(set => ({
  deleted: null,
  nonce: 0,
  show: deleted => set(state => ({ deleted, nonce: state.nonce + 1 })),
  dismiss: () => set({ deleted: null }),
}));
