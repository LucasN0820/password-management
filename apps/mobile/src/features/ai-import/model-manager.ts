import * as FileSystem from 'expo-file-system/legacy';
import { sha256File } from '../../../modules/expo-file-hash/src';
import {
  DEFAULT_MOBILE_MODEL_ID,
  getMobileModel,
  getMobileModelDownloadUrl,
  MOBILE_MODEL_CATALOG,
} from './model-catalog';
import type {
  MobileModelId,
  MobileModelManifest,
  MobileModelStatus,
  ModelDownloadProgress,
} from './types';

const MANIFEST_VERSION = 1;
const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}models/`;
const MANIFEST_PATH = `${MODELS_DIR}model-library.json`;

let activeDownload: FileSystem.DownloadResumable | null = null;
let activeDownloadModelId: MobileModelId | null = null;

function emptyManifest(): MobileModelManifest {
  return {
    version: MANIFEST_VERSION,
    defaultModelId: DEFAULT_MOBILE_MODEL_ID,
    models: {},
  };
}

async function ensureModelsDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('The app document directory is unavailable.');
  }
  await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
}

async function readManifest() {
  await ensureModelsDirectory();
  const info = await FileSystem.getInfoAsync(MANIFEST_PATH);
  if (!info.exists) return emptyManifest();

  try {
    const parsed = JSON.parse(
      await FileSystem.readAsStringAsync(MANIFEST_PATH)
    ) as MobileModelManifest;
    return parsed.version === MANIFEST_VERSION ? parsed : emptyManifest();
  } catch {
    return emptyManifest();
  }
}

async function writeManifest(manifest: MobileModelManifest) {
  await ensureModelsDirectory();
  await FileSystem.writeAsStringAsync(MANIFEST_PATH, JSON.stringify(manifest));
}

async function hasValidModelFile(modelId: MobileModelId, path: string) {
  const model = getMobileModel(modelId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && info.size === model.sizeBytes;
}

export async function getMobileModelStatuses(): Promise<MobileModelStatus[]> {
  const manifest = await readManifest();

  return Promise.all(
    MOBILE_MODEL_CATALOG.map(async model => {
      const entry = manifest.models[model.id];
      const downloaded = Boolean(
        entry &&
        entry.sha256 === model.sha256 &&
        (await hasValidModelFile(model.id, entry.path))
      );
      return {
        model,
        downloaded,
        path: downloaded && entry ? entry.path : null,
      };
    })
  );
}

export async function getDefaultMobileModelId() {
  const manifest = await readManifest();
  return manifest.defaultModelId;
}

export async function setDefaultMobileModel(modelId: MobileModelId) {
  getMobileModel(modelId);
  const manifest = await readManifest();
  manifest.defaultModelId = modelId;
  await writeManifest(manifest);
}

export async function markMobileModelUsed(modelId: MobileModelId) {
  const manifest = await readManifest();
  const entry = manifest.models[modelId];
  if (!entry) return;
  entry.lastUsedAt = new Date().toISOString();
  await writeManifest(manifest);
}

export async function downloadMobileModel(
  modelId: MobileModelId,
  onProgress?: (progress: ModelDownloadProgress) => void
) {
  if (activeDownload) {
    throw new Error(
      `A model download is already running: ${activeDownloadModelId}`
    );
  }

  const model = getMobileModel(modelId);
  await ensureModelsDirectory();
  const finalPath = `${MODELS_DIR}${model.fileName}`;
  const partialPath = `${finalPath}.partial`;
  await FileSystem.deleteAsync(partialPath, { idempotent: true });

  activeDownloadModelId = modelId;
  activeDownload = FileSystem.createDownloadResumable(
    getMobileModelDownloadUrl(model),
    partialPath,
    {},
    progress => {
      const totalBytes = progress.totalBytesExpectedToWrite || model.sizeBytes;
      onProgress?.({
        modelId,
        downloadedBytes: progress.totalBytesWritten,
        totalBytes,
        fraction:
          totalBytes > 0
            ? Math.min(progress.totalBytesWritten / totalBytes, 1)
            : 0,
      });
    }
  );

  try {
    const result = await activeDownload.downloadAsync();
    if (!result) throw new Error('Model download cancelled');

    const info = await FileSystem.getInfoAsync(partialPath);
    if (!info.exists || info.size !== model.sizeBytes) {
      throw new Error('Downloaded model size does not match the catalog.');
    }

    const hash = (await sha256File(partialPath)).toLowerCase();
    if (hash !== model.sha256) {
      throw new Error('Downloaded model failed SHA-256 verification.');
    }

    await FileSystem.deleteAsync(finalPath, { idempotent: true });
    await FileSystem.moveAsync({ from: partialPath, to: finalPath });

    const manifest = await readManifest();
    const now = new Date().toISOString();
    manifest.models[modelId] = {
      id: modelId,
      path: finalPath,
      sizeBytes: model.sizeBytes,
      sha256: model.sha256,
      downloadedAt: now,
      lastUsedAt: now,
    };
    await writeManifest(manifest);
    return finalPath;
  } catch (error) {
    await FileSystem.deleteAsync(partialPath, { idempotent: true });
    throw error;
  } finally {
    activeDownload = null;
    activeDownloadModelId = null;
  }
}

export async function cancelMobileModelDownload() {
  const download = activeDownload;
  if (download) await download.cancelAsync();
}

export async function removeMobileModel(modelId: MobileModelId) {
  const manifest = await readManifest();
  const entry = manifest.models[modelId];
  if (entry) {
    await FileSystem.deleteAsync(entry.path, { idempotent: true });
    delete manifest.models[modelId];
    await writeManifest(manifest);
  }
}
