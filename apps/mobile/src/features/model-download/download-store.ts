import { create } from 'zustand';
import type { ModelDownloadUiTask } from './types';

interface ModelDownloadStoreState {
  /** The single active (or just-finished) download, or null when idle. */
  activeTask: ModelDownloadUiTask | null;
  setActiveTask: (task: ModelDownloadUiTask | null) => void;
  patchActiveTask: (patch: Partial<ModelDownloadUiTask>) => void;
}

export const useModelDownloadStore = create<ModelDownloadStoreState>(set => ({
  activeTask: null,
  setActiveTask: task => set({ activeTask: task }),
  patchActiveTask: patch =>
    set(state =>
      state.activeTask
        ? { activeTask: { ...state.activeTask, ...patch } }
        : state
    ),
}));

/** Selector helpers — keep components subscribed to the smallest slice. */
export const selectActiveTask = (state: ModelDownloadStoreState) =>
  state.activeTask;

export const selectActiveDownloadModelId = (state: ModelDownloadStoreState) =>
  state.activeTask?.modelId ?? null;
