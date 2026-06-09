import { runImportWorkflow } from '@repo/ai-import-core';
import { getLocalAiImportConfig } from '../settings';
import type {
  ImportFileDescriptor,
  ImportWorkflowResult,
} from '../import/types';
import { createLocalLlamaExtractor } from './local-llama-provider';
import { getLlamaServerBaseUrl, releaseLlamaServer } from './llama-runtime';
import { resolveLocalModelConfig } from './model-cache';

export async function runLocalImportWorkflow(
  files: ImportFileDescriptor[],
  signal?: AbortSignal,
  modelId?: string
): Promise<ImportWorkflowResult> {
  const config = await resolveLocalModelConfig(
    getLocalAiImportConfig(),
    modelId
  );
  const baseUrl = await getLlamaServerBaseUrl(config, signal, modelId);

  try {
    return await runImportWorkflow(
      files,
      createLocalLlamaExtractor(baseUrl, config, signal)
    );
  } finally {
    releaseLlamaServer(config);
  }
}
