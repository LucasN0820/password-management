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
} from './types';

const MANIFEST_VERSION = 1;
const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}models/`;
const MANIFEST_PATH = `${MODELS_DIR}model-library.json`;

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
        entry?.sha256 === model.sha256 &&
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

/**
 * Resolve the on-disk locations for a model. The coordinator and native
 * transfer layer download into `partialPath`; `verifyAndCommitModel` promotes a
 * verified partial to `finalPath`.
 */
export async function getModelFilePaths(modelId: MobileModelId) {
  const model = getMobileModel(modelId);
  await ensureModelsDirectory();
  const finalPath = `${MODELS_DIR}${model.fileName}`;
  return {
    finalPath,
    partialPath: `${finalPath}.partial`,
    sourceUrl: getMobileModelDownloadUrl(model),
    expectedBytes: model.sizeBytes,
  };
}

/**
 * Verify a freshly downloaded `.partial` (size + SHA-256), atomically promote it
 * to the final GGUF file, and record it in `model-library.json`. The model
 * library only ever contains verified, inference-ready files.
 */
export async function verifyAndCommitModel(
  modelId: MobileModelId,
  partialPath: string
) {
  const model = getMobileModel(modelId);
  const { finalPath } = await getModelFilePaths(modelId);

  const info = await FileSystem.getInfoAsync(partialPath);
  if (!info.exists || info.size !== model.sizeBytes) {
    throw modelVerificationError(
      'size-mismatch',
      'Downloaded model size does not match the catalog.'
    );
  }

  const hash = (await sha256File(partialPath)).toLowerCase();
  if (hash !== model.sha256) {
    throw modelVerificationError(
      'sha256-mismatch',
      'Downloaded model failed SHA-256 verification.'
    );
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
}

export type ModelVerificationErrorCode = 'size-mismatch' | 'sha256-mismatch';

export interface ModelVerificationError extends Error {
  code: ModelVerificationErrorCode;
}

/** Build an error flagged as a verification failure (size or SHA-256). */
function modelVerificationError(
  code: ModelVerificationErrorCode,
  message: string
): ModelVerificationError {
  const error = new Error(message) as ModelVerificationError;
  error.name = 'ModelVerificationError';
  error.code = code;
  return error;
}

/** Type guard for {@link ModelVerificationError}. */
export function isModelVerificationError(
  error: unknown
): error is ModelVerificationError {
  return (
    error instanceof Error &&
    error.name === 'ModelVerificationError' &&
    'code' in error
  );
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
