import type { MobileModelCatalogEntry, MobileModelId } from './types';

export const DEFAULT_MOBILE_MODEL_ID: MobileModelId = 'qwen3-1.7b-q4-0';

export const MOBILE_MODEL_CATALOG: readonly MobileModelCatalogEntry[] = [
  {
    id: 'qwen3-1.7b-q4-0',
    family: 'Qwen',
    name: 'Qwen3 1.7B Q4_0',
    description: 'Best extraction quality for recent phones.',
    repo: 'bartowski/Qwen_Qwen3-1.7B-GGUF',
    fileName: 'Qwen_Qwen3-1.7B-Q4_0.gguf',
    sizeBytes: 1_231_813_024,
    sha256: 'c470091d31c4ada174ee5c2547daa020e930593cbca5ca8ca385ce8ff59a2fdf',
    recommended: true,
  },
  {
    id: 'gemma3-1b-qat-q4-0',
    family: 'Gemma',
    name: 'Gemma 3 1B QAT Q4_0',
    description: 'Balanced quality and memory usage.',
    repo: 'ggml-org/gemma-3-1b-it-qat-GGUF',
    fileName: 'gemma-3-1b-it-qat-Q4_0.gguf',
    sizeBytes: 720_425_600,
    sha256: 'ef60e4e91a738c99ae9976b050657dfe68a4007a0ccca121b55ec0c413dccd58',
  },
  {
    id: 'qwen3-0.6b-q4-0',
    family: 'Qwen',
    name: 'Qwen3 0.6B Q4_0',
    description: 'Smallest option for lower-memory phones.',
    repo: 'bartowski/Qwen_Qwen3-0.6B-GGUF',
    fileName: 'Qwen_Qwen3-0.6B-Q4_0.gguf',
    sizeBytes: 469_671_328,
    sha256: '4b78d8e3c61976cebb78ef5affe19d0eca75b1b47ec66f613a5a3245484758d5',
  },
] as const;

export function getMobileModel(modelId: MobileModelId) {
  const model = MOBILE_MODEL_CATALOG.find(item => item.id === modelId);
  if (!model) throw new Error(`Unknown mobile model: ${modelId}`);
  return model;
}

export function getMobileModelDownloadUrl(model: MobileModelCatalogEntry) {
  return `https://huggingface.co/${model.repo}/resolve/main/${encodeURIComponent(model.fileName)}?download=true`;
}
