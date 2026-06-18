import { useCallback } from 'react';
import { usePasswordStore } from '@/store/passwordStore';
import { useUndoDeleteStore } from './undo-store';

/**
 * Returns a delete function that captures the full record first, deletes it,
 * then surfaces an "Undo" snackbar. Use this instead of the store's
 * `deletePassword` directly so every delete path is undoable.
 */
export function useDeleteWithUndo() {
  const { findPassword, deletePassword } = usePasswordStore();
  const show = useUndoDeleteStore(state => state.show);

  return useCallback(
    async (id: number) => {
      const data = await findPassword(id);
      await deletePassword(id);
      if (data) {
        show(data);
      }
    },
    [findPassword, deletePassword, show]
  );
}
