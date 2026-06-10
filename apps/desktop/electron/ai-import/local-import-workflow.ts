import { randomUUID } from 'crypto';
import { runImportWorkflow } from '@repo/ai-import-core';
import { parseImportFile } from '@repo/ai-import-core/node';
import { getLocalAiImportConfig } from '../settings';
import type {
  ImportFileDescriptor,
  ImportWorkflowResult,
} from '../import/types';
import { createLocalLlamaExtractor } from './local-llama-provider';
import { getLlamaServerBaseUrl, releaseLlamaServer } from './llama-runtime';
import {
  resolveLocalModelConfig,
  type LocalModelDownloadProgressHandler,
} from './model-cache';

export async function runLocalImportWorkflow(
  files: ImportFileDescriptor[],
  signal?: AbortSignal,
  modelId?: string,
  onModelDownloadProgress?: LocalModelDownloadProgressHandler
): Promise<ImportWorkflowResult> {
  const config = await resolveLocalModelConfig(
    getLocalAiImportConfig(),
    modelId
  );
  const baseUrl = await getLlamaServerBaseUrl(
    config,
    signal,
    modelId,
    onModelDownloadProgress
  );

  try {
    return await runImportWorkflow(
      files,
      {
        parseFile: parseImportFile,
        extractCandidates: createLocalLlamaExtractor(baseUrl, config, signal),
        createId: randomUUID,
      },
      { signal }
    );
  } finally {
    releaseLlamaServer(config);
  }
}
