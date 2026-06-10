import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportProgress,
  ImportWorkflowResult,
} from '@repo/ai-import-core/types';

export type MobileModelId =
  | 'qwen3-1.7b-q4-0'
  | 'gemma3-1b-qat-q4-0'
  | 'qwen3-0.6b-q4-0';

export interface MobileModelCatalogEntry {
  id: MobileModelId;
  family: 'Qwen' | 'Gemma';
  name: string;
  description: string;
  repo: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  recommended?: boolean;
}

export interface MobileModelManifestEntry {
  id: MobileModelId;
  path: string;
  sizeBytes: number;
  sha256: string;
  downloadedAt: string;
  lastUsedAt: string;
}

export interface MobileModelManifest {
  version: 1;
  defaultModelId: MobileModelId;
  models: Partial<Record<MobileModelId, MobileModelManifestEntry>>;
}

export interface MobileModelStatus {
  model: MobileModelCatalogEntry;
  downloaded: boolean;
  path: string | null;
}

export interface ModelDownloadProgress {
  modelId: MobileModelId;
  downloadedBytes: number;
  totalBytes: number;
  fraction: number;
}

export interface EditableImportCandidate extends ImportCandidateDraft {
  selected: boolean;
}

export type MobileImportStage =
  | 'idle'
  | 'downloading'
  | 'processing'
  | 'review'
  | 'saving';

export type { ImportFileDescriptor, ImportProgress, ImportWorkflowResult };
