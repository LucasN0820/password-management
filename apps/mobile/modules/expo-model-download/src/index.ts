import { requireNativeModule } from 'expo';
import * as FileSystem from 'expo-file-system/legacy';

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

export interface NativeModelDownloadTask {
  taskId: string;
  modelId: string;
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
  modelId: string;
  url: string;
  destination: string;
  expectedBytes: number;
}

export interface Subscription {
  remove: () => void;
}

type TaskListener = (task: NativeModelDownloadTask) => void;

interface ModelDownloadBackend {
  isNative: boolean;
  startModelDownload: (input: StartModelDownloadInput) => Promise<void>;
  getActiveModelDownload: () => Promise<NativeModelDownloadTask | null>;
  cancelModelDownload: (taskId: string) => Promise<void>;
  resumeModelDownload: (taskId: string) => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
  addListener: (listener: TaskListener) => Subscription;
}

interface ExpoModelDownloadNativeModule {
  startModelDownload: (input: StartModelDownloadInput) => Promise<void>;
  getActiveModelDownload: () => Promise<NativeModelDownloadTask | null>;
  cancelModelDownload: (taskId: string) => Promise<void>;
  resumeModelDownload: (taskId: string) => Promise<void>;
  /**
   * Only the iOS module implements this; Android requests POST_NOTIFICATIONS
   * from JS via PermissionsAndroid, so the call is optional.
   */
  requestNotificationPermission?: () => Promise<void>;
  addListener: (
    event: 'onModelDownloadUpdate',
    listener: TaskListener
  ) => Subscription;
}

const NATIVE_EVENT = 'onModelDownloadUpdate';

function createNativeBackend(): ModelDownloadBackend | null {
  try {
    const native =
      requireNativeModule<ExpoModelDownloadNativeModule>('ExpoModelDownload');
    return {
      isNative: true,
      startModelDownload: input => native.startModelDownload(input),
      getActiveModelDownload: () => native.getActiveModelDownload(),
      cancelModelDownload: taskId => native.cancelModelDownload(taskId),
      resumeModelDownload: taskId => native.resumeModelDownload(taskId),
      requestNotificationPermission: async () => {
        await native.requestNotificationPermission?.();
      },
      addListener: listener => native.addListener(NATIVE_EVENT, listener),
    };
  } catch {
    return null;
  }
}

/**
 * Build a foreground-only fallback used until the app is rebuilt with the
 * native module, for example inside Expo Go or before `expo prebuild`. It keeps
 * the same task semantics the coordinator expects, but cannot survive the app
 * being killed; the native Android service and iOS background URLSession own
 * true background transfers. Resume data is kept in memory so pause and resume
 * within one session still performs an HTTP Range continuation.
 */
function createJsFallbackBackend(): ModelDownloadBackend {
  const now = () => new Date().toISOString();
  const listeners = new Set<TaskListener>();

  let task: NativeModelDownloadTask | null = null;
  let handle: FileSystem.DownloadResumable | null = null;
  let resumeData: string | undefined;

  function emit() {
    if (!task) return;
    const snapshot = { ...task };
    for (const listener of listeners) listener(snapshot);
  }

  function update(patch: Partial<NativeModelDownloadTask>) {
    if (!task) return;
    task = { ...task, ...patch, updatedAt: now() };
    emit();
  }

  function buildHandle(input: {
    url: string;
    destination: string;
    expectedBytes: number;
  }) {
    return FileSystem.createDownloadResumable(
      input.url,
      input.destination,
      {},
      progress => {
        const totalBytes =
          progress.totalBytesExpectedToWrite > 0
            ? progress.totalBytesExpectedToWrite
            : input.expectedBytes;
        update({
          state: 'downloading',
          downloadedBytes: progress.totalBytesWritten,
          totalBytes,
        });
      },
      resumeData
    );
  }

  async function run(input: {
    url: string;
    destination: string;
    expectedBytes: number;
  }) {
    handle = buildHandle(input);
    try {
      const result = resumeData
        ? await handle.resumeAsync()
        : await handle.downloadAsync();
      // `cancelAsync` resolves the pending promise with `undefined`; the cancel
      // path already moved the task to its terminal state, so do nothing here.
      if (!result) return;
      update({
        state: 'verifying',
        downloadedBytes: task?.totalBytes ?? input.expectedBytes,
      });
    } catch {
      // A rejected transfer is treated as a recoverable interruption: keep the
      // partial file and wait for an explicit resume. Real network/error
      // classification lives in the native backend.
      if (task?.state !== 'cancelled-by-user') {
        try {
          resumeData = handle?.savable()?.resumeData ?? resumeData;
        } catch {
          // Ignore — fall back to a fresh start on the next resume.
        }
        update({ state: 'waiting-to-resume' });
      }
    } finally {
      handle = null;
    }
  }

  return {
    isNative: false,
    startModelDownload: async input => {
      // Never leave a previous transfer running against the same file.
      if (handle) {
        const previous = handle;
        handle = null;
        await previous.cancelAsync().catch(() => undefined);
      }
      await FileSystem.deleteAsync(input.destination, { idempotent: true });
      resumeData = undefined;
      task = {
        taskId: input.taskId,
        modelId: input.modelId,
        state: 'starting',
        sourceUrl: input.url,
        partialPath: input.destination,
        finalPath: input.destination.replace(/\.partial$/, ''),
        downloadedBytes: 0,
        totalBytes: input.expectedBytes,
        createdAt: now(),
        updatedAt: now(),
      };
      emit();
      void run(input);
    },
    getActiveModelDownload: async () => task,
    cancelModelDownload: async taskId => {
      if (task?.taskId !== taskId) return;
      const current = handle;
      handle = null;
      update({ state: 'cancelled-by-user' });
      if (current) await current.cancelAsync().catch(() => undefined);
      await FileSystem.deleteAsync(task.partialPath, {
        idempotent: true,
      }).catch(() => undefined);
      task = null;
      resumeData = undefined;
    },
    resumeModelDownload: async taskId => {
      if (task?.taskId !== taskId || handle) return;
      void run({
        url: task.sourceUrl,
        destination: task.partialPath,
        expectedBytes: task.totalBytes,
      });
    },
    requestNotificationPermission: async () => {
      // No native notifications in the fallback transfer; nothing to authorize.
    },
    addListener: listener => {
      listeners.add(listener);
      return {
        remove: () => {
          listeners.delete(listener);
        },
      };
    },
  };
}

let backend: ModelDownloadBackend | null = null;

function getBackend() {
  if (!backend) backend = createNativeBackend() ?? createJsFallbackBackend();
  return backend;
}

/** True when the real native background transfer module is linked. */
export function isNativeModelDownloadAvailable() {
  return getBackend().isNative;
}

export function startModelDownload(input: StartModelDownloadInput) {
  return getBackend().startModelDownload(input);
}

export function getActiveModelDownload() {
  return getBackend().getActiveModelDownload();
}

export function cancelModelDownload(taskId: string) {
  return getBackend().cancelModelDownload(taskId);
}

export function resumeModelDownload(taskId: string) {
  return getBackend().resumeModelDownload(taskId);
}

/**
 * Request the OS notification permission used by the background download card.
 * On iOS this prompts via the native module; on Android the POST_NOTIFICATIONS
 * runtime grant is handled by the caller through PermissionsAndroid.
 */
export function requestNotificationPermission() {
  return getBackend().requestNotificationPermission();
}

export function addModelDownloadListener(
  listener: TaskListener
): Subscription {
  return getBackend().addListener(listener);
}
