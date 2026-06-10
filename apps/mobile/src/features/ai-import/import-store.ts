import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { create } from 'zustand';
import { runImportWorkflow } from '@repo/ai-import-core/workflow';
import type { PasswordInput } from '@repo/db';
import {
  cleanupPickedImportFiles,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_FILES,
  MAX_IMPORT_TOTAL_BYTES,
  parseMobileImportFile,
} from './mobile-file-parser';
import { createMobileLlamaExtractor } from './mobile-llama-extractor';
import {
  releaseMobileLlamaContext,
  stopMobileLlamaCompletion,
} from './mobile-llama-runtime';
import {
  cancelMobileModelDownload,
  downloadMobileModel,
  getDefaultMobileModelId,
  getMobileModelStatuses,
  removeMobileModel,
  setDefaultMobileModel,
} from './model-manager';
import type {
  EditableImportCandidate,
  ImportFileDescriptor,
  ImportProgress,
  MobileImportStage,
  MobileModelId,
  MobileModelStatus,
  ModelDownloadProgress,
} from './types';

interface MobileImportState {
  stage: MobileImportStage;
  files: ImportFileDescriptor[];
  models: MobileModelStatus[];
  selectedModelId: MobileModelId;
  candidates: EditableImportCandidate[];
  warnings: string[];
  error: string | null;
  progress: ImportProgress | null;
  downloadProgress: ModelDownloadProgress | null;
  initialize: () => Promise<void>;
  pickFiles: () => Promise<void>;
  selectModel: (modelId: MobileModelId) => Promise<void>;
  downloadSelectedModel: () => Promise<void>;
  cancelCurrentOperation: () => Promise<void>;
  removeModel: (modelId: MobileModelId) => Promise<void>;
  runImport: () => Promise<void>;
  updateCandidate: (
    id: string,
    patch: Partial<
      Pick<
        EditableImportCandidate,
        'title' | 'username' | 'password' | 'url' | 'notes' | 'selected'
      >
    >
  ) => void;
  removeCandidate: (id: string) => void;
  saveCandidates: (
    save: (data: PasswordInput[]) => Promise<void>
  ) => Promise<number>;
  handleAppBackground: () => Promise<void>;
  reset: () => Promise<void>;
}

let currentAbortController: AbortController | null = null;

function extensionForFile(name: string) {
  const match = name.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function cleanupFiles(files: ImportFileDescriptor[]) {
  await cleanupPickedImportFiles(files.map(file => file.path));
}

export const useMobileImportStore = create<MobileImportState>((set, get) => ({
  stage: 'idle',
  files: [],
  models: [],
  selectedModelId: 'qwen3-1.7b-q4-0',
  candidates: [],
  warnings: [],
  error: null,
  progress: null,
  downloadProgress: null,

  initialize: async () => {
    const [models, selectedModelId] = await Promise.all([
      getMobileModelStatuses(),
      getDefaultMobileModelId(),
    ]);
    set({ models, selectedModelId });
  },

  pickFiles: async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/plain', 'text/markdown'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    if (result.assets.length > MAX_IMPORT_FILES) {
      await cleanupPickedImportFiles(result.assets.map(asset => asset.uri));
      set({ error: `Select at most ${MAX_IMPORT_FILES} files.` });
      return;
    }

    const files = result.assets.map(asset => ({
      path: asset.uri,
      name: asset.name,
      size: asset.size ?? 0,
      extension: extensionForFile(asset.name),
    }));
    const unsupported = files.find(
      file => !['.csv', '.txt', '.md', '.markdown'].includes(file.extension)
    );
    const oversized = files.find(file => file.size > MAX_IMPORT_FILE_BYTES);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (unsupported || oversized || totalSize > MAX_IMPORT_TOTAL_BYTES) {
      await cleanupFiles(files);
      set({
        error: unsupported
          ? `Unsupported file: ${unsupported.name}`
          : oversized
            ? `${oversized.name} exceeds the 5MB limit.`
            : 'Selected files exceed the 15MB total limit.',
      });
      return;
    }

    await cleanupFiles(get().files);
    set({ files, error: null, candidates: [], warnings: [], progress: null });
  },

  selectModel: async modelId => {
    await setDefaultMobileModel(modelId);
    set({ selectedModelId: modelId, error: null });
  },

  downloadSelectedModel: async () => {
    const modelId = get().selectedModelId;
    set({ stage: 'downloading', error: null, downloadProgress: null });
    try {
      await downloadMobileModel(modelId, downloadProgress => {
        set({ downloadProgress });
      });
      set({
        models: await getMobileModelStatuses(),
        stage: 'idle',
        downloadProgress: null,
      });
    } catch (error) {
      set({
        stage: 'idle',
        downloadProgress: null,
        error: toErrorMessage(error, 'Model download failed.'),
      });
    }
  },

  cancelCurrentOperation: async () => {
    currentAbortController?.abort();
    await Promise.all([
      cancelMobileModelDownload().catch(() => undefined),
      stopMobileLlamaCompletion().catch(() => undefined),
    ]);
    set({ stage: 'idle', progress: null, downloadProgress: null });
  },

  removeModel: async modelId => {
    await releaseMobileLlamaContext();
    await removeMobileModel(modelId);
    set({ models: await getMobileModelStatuses() });
  },

  runImport: async () => {
    const { files, models, selectedModelId } = get();
    if (!files.length) {
      set({ error: 'Select at least one file before importing.' });
      return;
    }

    const selectedModel = models.find(
      item => item.model.id === selectedModelId
    );
    if (!selectedModel?.downloaded || !selectedModel.path) {
      set({ error: 'Download the selected model before importing.' });
      return;
    }

    currentAbortController = new AbortController();
    set({
      stage: 'processing',
      candidates: [],
      warnings: [],
      error: null,
      progress: null,
    });

    try {
      const result = await runImportWorkflow(
        files,
        {
          parseFile: parseMobileImportFile,
          extractCandidates: createMobileLlamaExtractor(
            selectedModelId,
            selectedModel.path
          ),
          createId: () => Crypto.randomUUID(),
        },
        {
          signal: currentAbortController.signal,
          onProgress: progress => set({ progress }),
        }
      );

      set({
        stage: 'review',
        candidates: result.candidates.map(candidate => ({
          ...candidate,
          selected: true,
        })),
        warnings: result.warnings,
        progress: null,
      });
    } catch (error) {
      set({
        stage: 'idle',
        progress: null,
        error: toErrorMessage(error, 'Import failed.'),
      });
    } finally {
      currentAbortController = null;
    }
  },

  updateCandidate: (id, patch) => {
    set(state => ({
      candidates: state.candidates.map(candidate =>
        candidate.id === id ? { ...candidate, ...patch } : candidate
      ),
    }));
  },

  removeCandidate: id => {
    set(state => ({
      candidates: state.candidates.filter(candidate => candidate.id !== id),
    }));
  },

  saveCandidates: async save => {
    const selected = get().candidates.filter(candidate => candidate.selected);
    if (!selected.length) {
      set({ error: 'Select at least one credential to save.' });
      return 0;
    }

    set({ stage: 'saving', error: null });
    try {
      await save(
        selected.map(candidate => ({
          title: candidate.title.trim() || 'Imported Credential',
          username: candidate.username.trim(),
          password: candidate.password,
          url: candidate.url?.trim() || null,
          notes: candidate.notes?.trim() || null,
          category: 'all',
          isFavorite: false,
          icon: null,
        }))
      );
      await cleanupFiles(get().files);
      await releaseMobileLlamaContext();
      set({
        stage: 'idle',
        files: [],
        candidates: [],
        warnings: [],
        progress: null,
      });
      return selected.length;
    } catch (error) {
      set({
        stage: 'review',
        error: toErrorMessage(error, 'Failed to save imported passwords.'),
      });
      return 0;
    }
  },

  handleAppBackground: async () => {
    if (get().stage === 'processing') {
      currentAbortController?.abort();
      set({
        stage: 'idle',
        progress: null,
        error: 'Import stopped because the app moved to the background.',
      });
    }
    await releaseMobileLlamaContext();
  },

  reset: async () => {
    currentAbortController?.abort();
    await Promise.all([cleanupFiles(get().files), releaseMobileLlamaContext()]);
    set({
      stage: 'idle',
      files: [],
      candidates: [],
      warnings: [],
      error: null,
      progress: null,
      downloadProgress: null,
    });
  },
}));
