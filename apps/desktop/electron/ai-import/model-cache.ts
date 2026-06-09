import { app } from 'electron';
import { createHash, randomUUID } from 'crypto';
import { createWriteStream, existsSync, statSync } from 'fs';
import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import type { LocalAiImportConfig } from '../settings';

const DEFAULT_MODEL_ID = 'gemma-4-26b-a4b-it-q4-k-m';
const LEGACY_MODEL_MANIFEST_FILE = 'manifest.json';
const MODEL_LIBRARY_FILE = 'model-library.json';

export type LocalModelFamily = 'qwen' | 'gemma' | 'gpt-oss' | 'custom';
export type LocalModelSource = 'catalog' | 'custom-file' | 'env-path';
export type LocalModelLifecycle =
  | 'not-downloaded'
  | 'ready'
  | 'missing'
  | 'custom-path';

export interface LocalModelCatalogEntry {
  id: string;
  family: Exclude<LocalModelFamily, 'custom'>;
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
      entry.fileName === fileName &&
      (!repo || entry.repo.toLowerCase() === repo.toLowerCase())
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
      models: parsed.models ?? [],
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
  if (manifest.models.length) {
    return manifest;
  }

  const legacy = await readLegacyManifest();
  if (!legacy || !existsSync(legacy.path)) {
    return manifest;
  }

  const catalogEntry = getCatalogEntryByFile(legacy.fileName, legacy.repo);
  const item: LocalModelLibraryItem = {
    id: catalogEntry?.id ?? randomUUID(),
    family: catalogEntry?.family ?? 'custom',
    displayName:
      catalogEntry?.displayName ?? basename(legacy.fileName, '.gguf'),
    path: legacy.path,
    source: catalogEntry ? 'catalog' : 'custom-file',
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
          ? 'custom-path'
          : 'missing'
        : exists
          ? 'ready'
          : 'missing',
  };
}

function envModelItem(
  config: LocalAiImportConfig
): LocalModelLibraryItem | null {
  if (!config.modelPath) return null;

  return {
    id: 'env-model-path',
    family: 'custom',
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

async function upsertModelItem(
  item: LocalModelLibraryItem,
  options: { makeDefault?: boolean } = {}
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
  url: string,
  destinationPath: string,
  expectedSha256?: string,
  signal?: AbortSignal
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
  let sizeBytes = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error('Local model download was cancelled');
      }

      const { done, value } = await reader.read();
      if (done) break;

      const buffer = Buffer.from(value);
      sizeBytes += buffer.length;
      hash.update(buffer);
      if (!writer.write(buffer)) {
        await new Promise<void>(resolve => {
          writer.once('drain', () => resolve());
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      writer.once('error', reject);
      writer.end(() => resolve());
    });

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

    return { sha256, sizeBytes };
  } catch (error) {
    writer.destroy();
    await rm(partialPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function prepareLocalModel(
  _config: LocalAiImportConfig,
  modelId?: string,
  signal?: AbortSignal
) {
  const entry = getCatalogEntry(modelId);
  const modelPath = getCatalogModelPath(entry);
  await mkdir(getModelsDir(), { recursive: true });

  let sha256 = entry.sha256;
  let sizeBytes = entry.sizeBytes;

  if (!existsSync(modelPath)) {
    const downloaded = await downloadFile(
      buildHuggingFaceDownloadUrl(entry),
      modelPath,
      entry.sha256,
      signal
    );
    sha256 = downloaded.sha256;
    sizeBytes = downloaded.sizeBytes;
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

export async function registerLocalModelFile(filePath: string) {
  const stats = statSync(filePath);
  const fileName = basename(filePath);
  const catalogEntry = getCatalogEntryByFile(fileName);
  const item: LocalModelLibraryItem = {
    id: catalogEntry?.id ?? `custom-${randomUUID()}`,
    family: catalogEntry?.family ?? 'custom',
    displayName: catalogEntry?.displayName ?? basename(fileName, '.gguf'),
    path: filePath,
    source: catalogEntry ? 'catalog' : 'custom-file',
    repo: catalogEntry?.repo,
    quant: catalogEntry?.quant,
    fileName,
    sizeBytes: stats.size,
    verified: false,
    addedAt: new Date().toISOString(),
  };

  return upsertModelItem(item, { makeDefault: true });
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
  const customItem = manifest.models.find(model => model.id === selectedId);
  if (customItem?.source === 'custom-file') {
    return {
      ...config,
      modelRepo: customItem.repo ?? config.modelRepo,
      modelQuant: customItem.quant ?? config.modelQuant,
      modelFile: customItem.fileName,
      modelPath: customItem.path,
    };
  }

  const entry =
    LOCAL_MODEL_CATALOG.find(item => item.id === selectedId) ??
    LOCAL_MODEL_CATALOG.find(item => item.id === customItem?.id) ??
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
        item.repo === resolvedConfig.modelRepo &&
        item.fileName === resolvedConfig.modelFile
    ) ?? getCatalogEntry(DEFAULT_MODEL_ID);
  return getCatalogModelPath(entry);
}

export async function ensureLocalModel(
  config: LocalAiImportConfig,
  signal?: AbortSignal,
  modelId?: string
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
        item.repo === resolvedConfig.modelRepo &&
        item.fileName === resolvedConfig.modelFile
    ) ?? getCatalogEntry(modelId);
  const status = await prepareLocalModel(resolvedConfig, entry.id, signal);
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
