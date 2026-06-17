import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { PermissionsAndroid, Platform } from 'react-native';
import { getMobileModel } from '@/features/ai-import/model-catalog';
import {
  getModelFilePaths,
  isModelVerificationError,
  verifyAndCommitModel,
} from '@/features/ai-import/model-manager';
import type { MobileModelId } from '@/features/ai-import/types';
import {
  addModelDownloadListener,
  cancelModelDownload as nativeCancel,
  getActiveModelDownload,
  type NativeModelDownloadTask,
  requestNotificationPermission as nativeRequestNotificationPermission,
  resumeModelDownload as nativeResume,
  startModelDownload as nativeStart,
} from '../../../modules/expo-model-download/src';
import { useModelDownloadStore } from './download-store';
import {
  clearActiveTask,
  readActiveTask,
  writeActiveTask,
} from './task-manifest';
import {
  type CancelReason,
  isActiveDownloadState,
  type ModelDownloadState,
  type ModelDownloadTaskRecord,
  type ModelDownloadUiTask,
} from './types';

const UI_THROTTLE_MS = 250;
const PERSIST_THROTTLE_MS = 500;
const PERSIST_FRACTION_STEP = 0.01;

let record: ModelDownloadTaskRecord | null = null;
let nativeSubscription: { remove: () => void } | null = null;
let initialized = false;
let verifying = false;

let lastUiAt = 0;
let lastPersistAt = 0;
let lastPersistFraction = 0;

export interface LibraryCommittedInfo {
  modelId: MobileModelId;
  modelName: string;
}

type LibraryListener = (info: LibraryCommittedInfo) => void;

const libraryListeners = new Set<LibraryListener>();

/** Notified after a download is verified and committed to the model library. */
export function registerLibraryCommittedListener(listener: LibraryListener) {
  libraryListeners.add(listener);
  return () => {
    libraryListeners.delete(listener);
  };
}

function notifyLibraryCommitted(info: LibraryCommittedInfo) {
  for (const listener of libraryListeners) listener(info);
}

function nowIso() {
  return new Date().toISOString();
}

function fractionOf(downloadedBytes: number, totalBytes: number) {
  return totalBytes > 0 ? Math.min(downloadedBytes / totalBytes, 1) : 0;
}

function toUiTask(current: ModelDownloadTaskRecord): ModelDownloadUiTask {
  return {
    taskId: current.taskId,
    modelId: current.modelId,
    modelName: getMobileModel(current.modelId).name,
    state: current.state,
    downloadedBytes: current.downloadedBytes,
    totalBytes: current.totalBytes,
    fraction: fractionOf(current.downloadedBytes, current.totalBytes),
    errorCode: current.errorCode,
  };
}

function pushUi(force: boolean) {
  if (!record) {
    useModelDownloadStore.getState().setActiveTask(null);
    return;
  }
  const ts = Date.now();
  if (!force && ts - lastUiAt < UI_THROTTLE_MS) return;
  lastUiAt = ts;
  useModelDownloadStore.getState().setActiveTask(toUiTask(record));
}

async function persist(force: boolean) {
  if (!record) return;
  const ts = Date.now();
  const fraction = fractionOf(record.downloadedBytes, record.totalBytes);
  const due =
    force ||
    ts - lastPersistAt >= PERSIST_THROTTLE_MS ||
    Math.abs(fraction - lastPersistFraction) >= PERSIST_FRACTION_STEP;
  if (!due) return;
  lastPersistAt = ts;
  lastPersistFraction = fraction;
  await writeActiveTask(record);
}

/**
 * Apply a record transition: update memory, push UI, persist. State changes are
 * always flushed immediately; pure progress ticks are throttled.
 */
async function commit(
  patch: Partial<ModelDownloadTaskRecord>,
  options: { stateChange?: boolean } = {}
) {
  if (!record) return;
  const stateChange =
    options.stateChange ?? (patch.state !== undefined && patch.state !== record.state);
  record = { ...record, ...patch, updatedAt: nowIso() };
  pushUi(stateChange);
  await persist(stateChange);
}

async function handleVerify(current: ModelDownloadTaskRecord) {
  if (verifying) return;
  verifying = true;
  try {
    await verifyAndCommitModel(current.modelId, current.partialPath);
    await commit({ state: 'completed', downloadedBytes: current.totalBytes });
    await clearActiveTask();
    notifyLibraryCommitted({
      modelId: current.modelId,
      modelName: getMobileModel(current.modelId).name,
    });
  } catch (error) {
    const corrupt = isModelVerificationError(error);
    if (corrupt) {
      // A size/SHA-256 failure means the partial is unusable — drop it.
      await FileSystem.deleteAsync(current.partialPath, {
        idempotent: true,
      }).catch(() => undefined);
    }
    await commit({
      state: 'failed',
      errorCode: corrupt ? error.code : 'verify-failed',
    });
    await writeActiveTask(record);
  } finally {
    verifying = false;
  }
}

function onNativeUpdate(task: NativeModelDownloadTask) {
  // Ignore stale events from a task we no longer track.
  if (task.taskId !== record?.taskId) return;
  // The user-cancel terminal state is owned by the coordinator's cancel command.
  if (record.state === 'cancelled-by-user') return;

  const nextState = task.state as ModelDownloadState;
  // Progress is monotonic within a transfer: ignore any downloaded count that
  // moves backwards while downloading. Guards against a duplicate/stray emitter
  // making the bar jump (e.g. 80% -> 20% -> 81%).
  const downloadedBytes =
    nextState === 'downloading'
      ? Math.max(task.downloadedBytes, record?.downloadedBytes ?? 0)
      : task.downloadedBytes;
  void (async () => {
    if (nextState === 'verifying') {
      await commit({
        state: 'verifying',
        downloadedBytes: task.downloadedBytes,
        totalBytes: task.totalBytes || record?.totalBytes || 0,
      });
      if (record) await handleVerify(record);
      return;
    }
    await commit({
      state: nextState,
      downloadedBytes,
      totalBytes: task.totalBytes || record?.totalBytes || 0,
      errorCode: task.errorCode ?? record?.errorCode,
    });
  })();
}

/**
 * Ask for the notification permission the download card needs, up front at app
 * load rather than gated behind the Download button. On Android this is the
 * `POST_NOTIFICATIONS` runtime permission (Android 13+ only); on iOS the native
 * module requests UNUserNotificationCenter authorization. Best-effort: if the
 * user denies, the download still runs — it just loses its system notification.
 */
export async function ensureNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      if (typeof Platform.Version === 'number' && Platform.Version < 33) return;
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (!permission) return;
      if (await PermissionsAndroid.check(permission)) return;
      await PermissionsAndroid.request(permission);
    } else if (Platform.OS === 'ios') {
      await nativeRequestNotificationPermission();
    }
  } catch {
    // Ignore — the transfer must not depend on the notification permission.
  }
}

function ensureSubscribed() {
  if (!nativeSubscription) {
    nativeSubscription = addModelDownloadListener(onNativeUpdate);
  }
}

/** Single-active-download guard. Returns the live record if one is running. */
function activeRecord() {
  return record && isActiveDownloadState(record.state) ? record : null;
}

export function getActiveDownloadRecord() {
  return record;
}

/**
 * Start downloading a catalog model. Enforces the single-task constraint and
 * hands the transfer to the native module (or JS fallback).
 */
export async function startModelDownloadFor(modelId: MobileModelId) {
  ensureSubscribed();
  const running = activeRecord();
  if (running) {
    if (running.modelId === modelId) return;
    throw new Error('Another model download is already in progress.');
  }

  const { partialPath, finalPath, sourceUrl, expectedBytes } =
    await getModelFilePaths(modelId);
  await FileSystem.deleteAsync(partialPath, { idempotent: true });

  const taskId = Crypto.randomUUID();
  record = {
    taskId,
    modelId,
    state: 'queued',
    sourceUrl,
    partialPath,
    finalPath,
    downloadedBytes: 0,
    totalBytes: expectedBytes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    retryCount: 0,
  };
  lastPersistFraction = 0;
  pushUi(true);
  await writeActiveTask(record);

  await nativeStart({
    taskId,
    modelId,
    url: sourceUrl,
    destination: partialPath,
    expectedBytes,
  });
}

/** Retry a failed download from any reusable partial. */
export async function retryActiveDownload() {
  if (!record) return;
  if (isActiveDownloadState(record.state)) return;
  const { modelId } = record;
  record = null;
  await clearActiveTask();
  await startModelDownloadFor(modelId);
}

/**
 * The only path that produces `cancelled-by-user`. Records `userCancelledAt`,
 * cancels the native transfer, then removes the partial, resume data and
 * manifest. Never invoked by navigation, backgrounding or network loss.
 */
export async function cancelActiveDownload(reason: CancelReason = 'user') {
  if (!record) return;
  const current = record;
  await commit(
    { state: 'cancelled-by-user', userCancelledAt: nowIso() },
    { stateChange: true }
  );
  await writeActiveTask(record);
  await nativeCancel(current.taskId).catch(() => undefined);
  await FileSystem.deleteAsync(current.partialPath, {
    idempotent: true,
  }).catch(() => undefined);
  record = null;
  await clearActiveTask();
  // Surface the cancelled snapshot briefly, then clear.
  useModelDownloadStore.getState().setActiveTask(null);
  void reason;
}

/**
 * Resume an interrupted (waiting) transfer without changing cancel semantics.
 * Only waiting states are resumable — a transfer that is already `downloading`
 * must be left alone, otherwise re-issuing start/resume spawns a second
 * concurrent transfer writing the same partial (progress flickers backwards).
 */
export async function resumeActiveDownload() {
  if (!record) return;
  if (
    record.state !== 'waiting-to-resume' &&
    record.state !== 'waiting-for-network'
  ) {
    return;
  }
  ensureSubscribed();
  try {
    await nativeResume(record.taskId);
  } catch {
    await rebindOrRestart(record);
  }
}

/** Clear a terminal (completed/failed/cancelled) task from the store + manifest. */
export async function dismissActiveDownload() {
  if (record && isActiveDownloadState(record.state)) return;
  record = null;
  useModelDownloadStore.getState().setActiveTask(null);
  await clearActiveTask();
}

async function rebindOrRestart(current: ModelDownloadTaskRecord) {
  try {
    await nativeStart({
      taskId: current.taskId,
      modelId: current.modelId,
      url: current.sourceUrl,
      destination: current.partialPath,
      expectedBytes: current.totalBytes,
    });
  } catch {
    await commit({ state: 'failed', errorCode: 'rebind-failed' });
  }
}

/**
 * Re-attach to any in-flight or interrupted task on app start. Adopts the live
 * native task when present, re-runs verification for a completed transfer, or
 * marks an orphaned task as waiting and attempts to resume it.
 */
export async function initModelDownloadCoordinator() {
  if (initialized) return;
  initialized = true;
  ensureSubscribed();

  const persisted = await readActiveTask();
  const native = await getActiveModelDownload().catch(() => null);

  if (native) {
    record = persisted ?? {
      taskId: native.taskId,
      modelId: native.modelId as MobileModelId,
      state: native.state,
      sourceUrl: native.sourceUrl,
      partialPath: native.partialPath,
      finalPath: native.finalPath,
      downloadedBytes: native.downloadedBytes,
      totalBytes: native.totalBytes,
      createdAt: native.createdAt,
      updatedAt: native.updatedAt,
      retryCount: 0,
    };
    record = {
      ...record,
      state: native.state,
      downloadedBytes: native.downloadedBytes,
      totalBytes: native.totalBytes || record.totalBytes,
    };
    pushUi(true);
    await writeActiveTask(record);
    if (native.state === 'verifying') await handleVerify(record);
    return;
  }

  if (!persisted) return;

  // No live native task. Decide based on the persisted state.
  if (persisted.state === 'completed') {
    record = null;
    await clearActiveTask();
    return;
  }

  record = persisted;
  if (persisted.state === 'verifying') {
    pushUi(true);
    await handleVerify(persisted);
    return;
  }

  if (isActiveDownloadState(persisted.state)) {
    record = { ...persisted, state: 'waiting-to-resume' };
    pushUi(true);
    await writeActiveTask(record);
    await rebindOrRestart(record);
    return;
  }

  // Terminal (failed / cancelled): surface for retry/dismissal in the UI.
  pushUi(true);
}
