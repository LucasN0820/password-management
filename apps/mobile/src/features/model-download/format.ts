import type { ModelDownloadState } from './types';

export function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

const STATUS_KEYS: Partial<Record<ModelDownloadState, string>> = {
  verifying: 'aiImport.verifying',
  'waiting-for-network': 'aiImport.waitingForNetwork',
  'waiting-to-resume': 'aiImport.waitingToResume',
  failed: 'aiImport.downloadFailed',
  completed: 'aiImport.downloadComplete',
};

/** Maps a download state to its `aiImport.*` translation key. */
export function downloadStatusKey(state: ModelDownloadState): string {
  return STATUS_KEYS[state] ?? 'aiImport.downloadTitle';
}
