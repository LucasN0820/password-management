import type { MobileModelId } from '@/features/ai-import/types';

/**
 * Unified model-download lifecycle. The native transfer layer (Android service /
 * iOS background URLSession, or the JS fallback) owns every state up to and
 * including `verifying` (bytes on disk, ready for hash). The JS coordinator owns
 * `verifying` to `completed` / `failed` and every `cancelled-by-user` transition.
 */
export type ModelDownloadState =
  | 'queued'
  | 'starting'
  | 'downloading'
  | 'waiting-for-network'
  | 'waiting-to-resume'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled-by-user';

/** A non-terminal state still owns a partial file worth keeping. */
export const ACTIVE_DOWNLOAD_STATES: readonly ModelDownloadState[] = [
  'queued',
  'starting',
  'downloading',
  'waiting-for-network',
  'waiting-to-resume',
  'verifying',
];

export function isActiveDownloadState(state: ModelDownloadState) {
  return ACTIVE_DOWNLOAD_STATES.includes(state);
}

/**
 * Raw task snapshot emitted by the native transfer layer. Intentionally a flat,
 * serialisable record so it survives the native bridge and the manifest file
 * unchanged.
 */
export interface NativeModelDownloadTask {
  taskId: string;
  modelId: MobileModelId;
  state: ModelDownloadState;
  sourceUrl: string;
  partialPath: string;
  finalPath: string;
  downloadedBytes: number;
  totalBytes: number;
  createdAt: string;
  updatedAt: string;
  errorCode?: string;
}

export interface StartModelDownloadInput {
  taskId: string;
  modelId: MobileModelId;
  url: string;
  destination: string;
  expectedBytes: number;
}

/** Reason recorded so the coordinator never confuses a system stop with a user Cancel. */
export type CancelReason = 'user';

/**
 * UI-facing snapshot the global store exposes. Adds derived fields (`fraction`,
 * display name) so components never recompute them on every progress tick.
 */
export interface ModelDownloadUiTask {
  taskId: string;
  modelId: MobileModelId;
  modelName: string;
  state: ModelDownloadState;
  downloadedBytes: number;
  totalBytes: number;
  fraction: number;
  errorCode?: string;
}

/** Persisted manifest at `models/model-download-tasks.json`. */
export interface ModelDownloadTaskManifest {
  version: 1;
  activeTask: ModelDownloadTaskRecord | null;
}

export interface ModelDownloadTaskRecord {
  taskId: string;
  modelId: MobileModelId;
  state: ModelDownloadState;
  sourceUrl: string;
  partialPath: string;
  finalPath: string;
  downloadedBytes: number;
  totalBytes: number;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  userCancelledAt?: string;
  errorCode?: string;
  etag?: string;
  /** Opaque blob the JS fallback uses to resume `expo-file-system` downloads. */
  resumeData?: string;
}
