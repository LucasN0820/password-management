import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { app } from 'electron';
import type { LocalAiImportConfig } from '../settings';

const DEFAULT_MODEL_ID = 'gemma-4-26b-a4b-it-q4-k-m';
const LEGACY_MODEL_MANIFEST_FILE = 'manifest.json';
const MODEL_LIBRARY_FILE = 'model-library.json';

export type LocalModelFamily = 'qwen' | 'gemma' | 'gpt-oss' | 'env';
export type LocalModelSource = 'catalog' | 'env-path';
export type LocalModelLifecycle =
  | 'not-downloaded'
  | 'ready'
  | 'missing'
  | 'env-path';

export interface LocalModelCatalogEntry {
  id: string;
  family: Exclude<LocalModelFamily, 'env'>;
  displayName: string;
  repo: string;
  quant: string;
  fileName: string;
  sizeBytes?: number;
  sha256?: string;
  downloadUrl?: string;
  recommended: boolean;
  minMemoryGb?: number;
  contextSize: number;
  maxTokens: number;
  description: string;
}

export interface LocalModelLibraryItem {
  id: string;
  family: LocalModelFamily;
  displayName: string;
  path: string;
  source: LocalModelSource;
  repo?: string;
  quant?: string;
  fileName: string;
  sizeBytes?: number;
  sha256?: string;
  verified: boolean;
  downloadedAt?: string;
  addedAt: string;
  lastUsedAt?: string;
}

export interface LocalModelStatus extends LocalModelLibraryItem {
  lifecycle: LocalModelLifecycle;
  exists: boolean;
  isDefault: boolean;
}

interface LegacyLocalModelManifest {
  repo: string;
  quant: string;
  fileName: string;
  path: string;
  sizeBytes: number;
  sha256: string;
  downloadedAt: string;
}

interface LocalModelLibraryManifest {
  version: 1;
  defaultModelId: string;
  models: LocalModelLibraryItem[];
}

export interface LocalModelLibraryStatus {
  defaultModelId: string;
  catalog: LocalModelCatalogEntry[];
  models: LocalModelStatus[];
}

export interface LocalModelDownloadProgress {
  modelId: string;
  displayName: string;
  status:
    | 'starting'
    | 'downloading'
    | 'verifying'
    | 'completed'
    | 'cancelled'
    | 'failed';
  downloadedBytes: number;
  totalBytes?: number;
  bytesPerSecond?: number;
  estimatedSecondsRemaining?: number;
  path: string;
  error?: {
    code: string;
    message: string;
  };
}

export type LocalModelDownloadProgressHandler = (
  progress: LocalModelDownloadProgress
) => void;

export const LOCAL_MODEL_CATALOG: LocalModelCatalogEntry[] = [
  {
    id: 'qwen3-4b-q4-k-m',
    family: 'qwen',
    displayName: 'Qwen3 4B Q4_K_M',
    repo: 'Qwen/Qwen3-4B-GGUF',
    quant: 'Q4_K_M',
    fileName: 'Qwen3-4B-Q4_K_M.gguf',
    sizeBytes: 2_500_000_000,
    recommended: false,
    minMemoryGb: 8,
    contextSize: 8192,
    maxTokens: 2000,
    description: 'Small multilingual model for faster local extraction.',
  },
  {
    id: DEFAULT_MODEL_ID,
    family: 'gemma',
    displayName: 'Gemma 4 26B A4B Q4_K_M',
    repo: 'ggml-org/gemma-4-26B-A4B-it-GGUF',
    quant: 'Q4_K_M',
    fileName: 'gemma-4-26B-A4B-it-Q4_K_M.gguf',
    sizeBytes: 16_800_000_000,
    recommended: true,
    minMemoryGb: 24,
    contextSize: 8192,
    maxTokens: 2000,
    description: 'Default high-quality local extractor.',
  },
  {
    id: 'gpt-oss-20b-mxfp4',
    family: 'gpt-oss',
    displayName: 'gpt-oss 20B MXFP4',
    repo: 'ggml-org/gpt-oss-20b-GGUF',
    quant: 'MXFP4',
    fileName: 'gpt-oss-20b-mxfp4.gguf',
    sizeBytes: 11_300_000_000,
    recommended: false,
    minMemoryGb: 16,
    contextSize: 8192,
    maxTokens: 2000,
    description: 'Open-weight MoE option with smaller on-disk size than Gemma.',
  },
];

function getModelsDir() {
  return join(app.getPath('userData'), 'models');
}

export function getLocalModelsDir() {
  return getModelsDir();
}

function getLegacyManifestPath() {
  return join(getModelsDir(), LEGACY_MODEL_MANIFEST_FILE);
}

function getLibraryPath() {
  return join(getModelsDir(), MODEL_LIBRARY_FILE);
}

function getCatalogEntry(modelId?: string) {
  return (
    LOCAL_MODEL_CATALOG.find(entry => entry.id === modelId) ??
    LOCAL_MODEL_CATALOG.find(entry => entry.id === DEFAULT_MODEL_ID) ??
    LOCAL_MODEL_CATALOG[0]
  );
}

function getCatalogEntryByFile(fileName: string, repo?: string) {
  return LOCAL_MODEL_CATALOG.find(
    entry =>
      { return entry.fileName === fileName &&
      (!repo || entry.repo.toLowerCase() === repo.toLowerCase()) }
  );
}

async function readLegacyManifest() {
  try {
    return JSON.parse(
      await readFile(getLegacyManifestPath(), 'utf8')
    ) as LegacyLocalModelManifest;
  } catch {
    return null;
  }
}

async function readLibraryManifest() {
  try {
    const parsed = JSON.parse(
      await readFile(getLibraryPath(), 'utf8')
    ) as LocalModelLibraryManifest;
    return {
      version: 1,
      defaultModelId: parsed.defaultModelId || DEFAULT_MODEL_ID,
      models: (parsed.models ?? []).filter(model => model.source === 'catalog'),
    } satisfies LocalModelLibraryManifest;
  } catch {
    return {
      version: 1,
      defaultModelId: DEFAULT_MODEL_ID,
      models: [],
    } satisfies LocalModelLibraryManifest;
  }
}

async function writeLibraryManifest(manifest: LocalModelLibraryManifest) {
  await mkdir(getModelsDir(), { recursive: true });
  await writeFile(getLibraryPath(), JSON.stringify(manifest, null, 2), 'utf8');
}

async function getLibraryManifest() {
  const manifest = await readLibraryManifest();
  if (manifest.models.length > 0) {
    return manifest;
  }

  const legacy = await readLegacyManifest();
  if (!legacy || !existsSync(legacy.path)) {
    return manifest;
  }

  const catalogEntry = getCatalogEntryByFile(legacy.fileName, legacy.repo);
  if (!catalogEntry) {
    return manifest;
  }

  const item: LocalModelLibraryItem = {
    id: catalogEntry.id,
    family: catalogEntry.family,
    displayName: catalogEntry.displayName,
    path: legacy.path,
    source: 'catalog',
    repo: legacy.repo,
    quant: legacy.quant,
    fileName: legacy.fileName,
    sizeBytes: legacy.sizeBytes,
    sha256: legacy.sha256,
    verified: Boolean(legacy.sha256),
    downloadedAt: legacy.downloadedAt,
    addedAt: legacy.downloadedAt,
  };

  const migrated = {
    ...manifest,
    defaultModelId: item.id,
    models: [item],
  };
  await writeLibraryManifest(migrated);
  return migrated;
}

function buildHuggingFaceDownloadUrl(entry: LocalModelCatalogEntry) {
  const fileName = encodeURIComponent(entry.fileName);
  return (
    entry.downloadUrl ??
    `https://huggingface.co/${entry.repo}/resolve/main/${fileName}?download=true`
  );
}

function getCatalogModelPath(entry: LocalModelCatalogEntry) {
  return join(getModelsDir(), entry.fileName);
}

function toStatus(
  item: LocalModelLibraryItem,
  defaultModelId: string
): LocalModelStatus {
  const exists = existsSync(item.path);
  return {
    ...item,
    exists,
    isDefault: item.id === defaultModelId,
    lifecycle:
      item.source === 'env-path'
        ? exists
          ? 'env-path'
          : 'missing'
        : exists
          ? 'ready'
          : 'missing',
  };
}

function envModelItem(
  config: LocalAiImportConfig
): LocalModelLibraryItem | null {
  if (!config.modelPath) {return null;}

  return {
    id: 'env-model-path',
    family: 'env',
    displayName: basename(config.modelPath, '.gguf') || 'Environment model',
    path: config.modelPath,
    source: 'env-path',
    repo: config.modelRepo,
    quant: config.modelQuant,
    fileName: basename(config.modelPath),
    verified: false,
    addedAt: new Date().toISOString(),
  };
}

export async function getLocalModelLibraryStatus(
  config: LocalAiImportConfig
): Promise<LocalModelLibraryStatus> {
  const manifest = await getLibraryManifest();
  const envItem = envModelItem(config);
  const models = envItem ? [envItem, ...manifest.models] : manifest.models;
  const defaultModelId = envItem?.id ?? manifest.defaultModelId;

  return {
    defaultModelId,
    catalog: LOCAL_MODEL_CATALOG,
    models: models.map(item => toStatus(item, defaultModelId)),
  };
}

export async function getLocalModelStatus(
  config: LocalAiImportConfig
): Promise<LocalModelStatus> {
  const library = await getLocalModelLibraryStatus(config);
  const existingDefault = library.models.find(model => model.isDefault);
  if (existingDefault) {
    return existingDefault;
  }

  const fallback = getCatalogEntry(library.defaultModelId);
  const path = getCatalogModelPath(fallback);
  return toStatus(
    {
      id: fallback.id,
      family: fallback.family,
      displayName: fallback.displayName,
      path,
      source: 'catalog',
      repo: fallback.repo,
      quant: fallback.quant,
      fileName: fallback.fileName,
      sizeBytes: fallback.sizeBytes,
      sha256: fallback.sha256,
      verified: Boolean(fallback.sha256),
      addedAt: new Date().toISOString(),
    },
    fallback.id
  );
}

interface InlineInterface { makeDefault?: boolean }
async function upsertModelItem(
  item: LocalModelLibraryItem,
  options: InlineInterface = {}
) {
  const manifest = await getLibraryManifest();
  const deduped = manifest.models.filter(
    model => model.id !== item.id && model.path !== item.path
  );
  const nextManifest = {
    ...manifest,
    defaultModelId: options.makeDefault ? item.id : manifest.defaultModelId,
    models: [...deduped, item],
  };
  await writeLibraryManifest(nextManifest);
  return toStatus(item, nextManifest.defaultModelId);
}

async function downloadFile(
  entry: LocalModelCatalogEntry,
  url: string,
  destinationPath: string,
  expectedSha256?: string,
  signal?: AbortSignal,
  onProgress?: LocalModelDownloadProgressHandler
) {
  const partialPath = `${destinationPath}.partial`;
  const response = await fetch(url, { signal });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download local model: HTTP ${response.status}`);
  }

  await rm(partialPath, { force: true }).catch(() => undefined);

  const hash = createHash('sha256');
  const writer = createWriteStream(partialPath);
  const reader = response.body.getReader();
  const totalBytesHeader = response.headers.get('content-length');
  const totalBytes = totalBytesHeader
    ? Number.parseInt(totalBytesHeader, 10)
    : undefined;
  const startedAt = Date.now();
  let lastProgressAt = 0;
  let sizeBytes = 0;

  const emitProgress = (
    status: LocalModelDownloadProgress['status'],
    error?: LocalModelDownloadProgress['error'],
    force = false
  ) => {
    if (!onProgress) {return;}

    const now = Date.now();
    if (!force && status === 'downloading' && now - lastProgressAt < 250) {
      return;
    }
    lastProgressAt = now;

    const elapsedSeconds = Math.max((now - startedAt) / 1000, 0.1);
    const bytesPerSecond = sizeBytes / elapsedSeconds;
    const remainingBytes =
      totalBytes && totalBytes > sizeBytes ? totalBytes - sizeBytes : 0;
    const estimatedSecondsRemaining =
      remainingBytes && bytesPerSecond
        ? remainingBytes / bytesPerSecond
        : undefined;

    onProgress({
      modelId: entry.id,
      displayName: entry.displayName,
      status,
      downloadedBytes: sizeBytes,
      totalBytes,
      bytesPerSecond,
      estimatedSecondsRemaining,
      path: destinationPath,
      error,
    });
  };

  try {
    emitProgress('downloading', undefined, true);

    while (true) {
      if (signal?.aborted) {
        throw new Error('Local model download was cancelled');
      }

      const { done, value } = await reader.read();
      if (done) {break;}

      const buffer = Buffer.from(value);
      sizeBytes = sizeBytes + buffer.length;
      hash.update(buffer);
      emitProgress('downloading');
      if (!writer.write(buffer)) {
        await new Promise<void>(resolve => {
          writer.once('drain', () => { resolve(); });
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      writer.once('error', reject);
      writer.end(() => { resolve(); });
    });

    emitProgress('verifying', undefined, true);

    const sha256 = hash.digest('hex');

    if (
      expectedSha256 &&
      sha256.toLowerCase() !== expectedSha256.toLowerCase()
    ) {
      throw new Error(
        `Downloaded model checksum mismatch. Expected ${expectedSha256}, got ${sha256}.`
      );
    }

    await rename(partialPath, destinationPath);

    emitProgress('completed', undefined, true);

    return { sha256, sizeBytes };
  } catch (error) {
    writer.destroy();
    await rm(partialPath, { force: true }).catch(() => undefined);
    emitProgress(
      signal?.aborted ? 'cancelled' : 'failed',
      {
        code: signal?.aborted ? 'download_cancelled' : 'download_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Local model download failed',
      },
      true
    );
    throw error;
  }
}

export async function prepareLocalModel(
  _config: LocalAiImportConfig,
  modelId?: string,
  signal?: AbortSignal,
  onProgress?: LocalModelDownloadProgressHandler
) {
  const entry = getCatalogEntry(modelId);
  const modelPath = getCatalogModelPath(entry);
  await mkdir(getModelsDir(), { recursive: true });

  let {sha256} = entry;
  let {sizeBytes} = entry;

  if (!existsSync(modelPath)) {
    onProgress?.({
      modelId: entry.id,
      displayName: entry.displayName,
      status: 'starting',
      downloadedBytes: 0,
      totalBytes: entry.sizeBytes,
      path: modelPath,
    });

    const downloaded = await downloadFile(
      entry,
      buildHuggingFaceDownloadUrl(entry),
      modelPath,
      entry.sha256,
      signal,
      onProgress
    );
    sha256 = downloaded.sha256;
    sizeBytes = downloaded.sizeBytes;
  } else {
    onProgress?.({
      modelId: entry.id,
      displayName: entry.displayName,
      status: 'completed',
      downloadedBytes: sizeBytes ?? 0,
      totalBytes: sizeBytes,
      path: modelPath,
    });
  }

  const item: LocalModelLibraryItem = {
    id: entry.id,
    family: entry.family,
    displayName: entry.displayName,
    path: modelPath,
    source: 'catalog',
    repo: entry.repo,
    quant: entry.quant,
    fileName: entry.fileName,
    sizeBytes,
    sha256,
    verified: Boolean(sha256),
    downloadedAt: new Date().toISOString(),
    addedAt: new Date().toISOString(),
  };

  return upsertModelItem(item, { makeDefault: true });
}

export async function removeLocalModel(modelId: string) {
  const manifest = await getLibraryManifest();
  const model = manifest.models.find(item => item.id === modelId);

  if (!model) {
    throw new Error(`Local model is not downloaded: ${modelId}`);
  }

  if (model.source !== 'catalog') {
    throw new Error('Only downloaded catalog models can be removed.');
  }

  await rm(model.path, { force: true }).catch(() => undefined);
  await rm(`${model.path}.partial`, { force: true }).catch(() => undefined);

  const models = manifest.models.filter(item => item.id !== modelId);
  const nextManifest = {
    ...manifest,
    defaultModelId:
      manifest.defaultModelId === modelId
        ? (models[0]?.id ?? DEFAULT_MODEL_ID)
        : manifest.defaultModelId,
    models,
  };

  await writeLibraryManifest(nextManifest);
  return getLocalModelLibraryStatus({} as LocalAiImportConfig);
}

export async function setDefaultLocalModel(modelId: string) {
  const manifest = await getLibraryManifest();
  const modelExists =
    modelId === 'env-model-path' ||
    manifest.models.some(model => model.id === modelId) ||
    LOCAL_MODEL_CATALOG.some(entry => entry.id === modelId);

  if (!modelExists) {
    throw new Error(`Unknown local model: ${modelId}`);
  }

  const nextManifest = {
    ...manifest,
    defaultModelId: modelId,
  };
  await writeLibraryManifest(nextManifest);
  return getLocalModelLibraryStatus({} as LocalAiImportConfig);
}

export async function resolveLocalModelConfig(
  config: LocalAiImportConfig,
  modelId?: string
): Promise<LocalAiImportConfig> {
  if (config.modelPath) {
    return config;
  }

  const manifest = await getLibraryManifest();
  const selectedId = modelId ?? manifest.defaultModelId ?? DEFAULT_MODEL_ID;

  const entry =
    LOCAL_MODEL_CATALOG.find(item => item.id === selectedId) ??
    getCatalogEntry(DEFAULT_MODEL_ID);

  return {
    ...config,
    modelRepo: entry.repo,
    modelQuant: entry.quant,
    modelFile: entry.fileName,
    modelSha256: entry.sha256,
    modelDownloadUrl: entry.downloadUrl,
    contextSize: entry.contextSize,
    maxTokens: entry.maxTokens,
  };
}

export async function resolveLocalModelPath(
  config: LocalAiImportConfig,
  modelId?: string
) {
  const resolvedConfig = await resolveLocalModelConfig(config, modelId);
  if (resolvedConfig.modelPath) {
    return resolvedConfig.modelPath;
  }

  const entry =
    LOCAL_MODEL_CATALOG.find(
      item =>
        { return item.repo === resolvedConfig.modelRepo &&
        item.fileName === resolvedConfig.modelFile }
    ) ?? getCatalogEntry(DEFAULT_MODEL_ID);
  return getCatalogModelPath(entry);
}

export async function ensureLocalModel(
  config: LocalAiImportConfig,
  signal?: AbortSignal,
  modelId?: string,
  onProgress?: LocalModelDownloadProgressHandler
) {
  const resolvedConfig = await resolveLocalModelConfig(config, modelId);

  if (resolvedConfig.modelPath) {
    if (existsSync(resolvedConfig.modelPath)) {
      return resolvedConfig.modelPath;
    }
    throw new Error(
      [
        'Local AI model not found.',
        `Expected model at ${resolvedConfig.modelPath}.`,
        'Choose another local model or download a catalog model before starting AI Import.',
      ].join(' ')
    );
  }

  const entry =
    LOCAL_MODEL_CATALOG.find(
      item =>
        { return item.repo === resolvedConfig.modelRepo &&
        item.fileName === resolvedConfig.modelFile }
    ) ?? getCatalogEntry(modelId);
  const status = await prepareLocalModel(
    resolvedConfig,
    entry.id,
    signal,
    onProgress
  );
  return status.path;
}

export async function assertLocalModelExists(
  config: LocalAiImportConfig,
  modelId?: string
) {
  const modelPath = await resolveLocalModelPath(config, modelId);

  if (!existsSync(modelPath)) {
    throw new Error(
      [
        'Local AI model not found.',
        `Expected model at ${modelPath}.`,
        'Choose another local model or download this model before starting AI Import.',
      ].join(' ')
    );
  }

  return modelPath;
}
