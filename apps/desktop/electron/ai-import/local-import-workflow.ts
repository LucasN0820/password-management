import { runImportWorkflow } from '@repo/ai-import-core'
import { getLocalAiImportConfig } from '../settings'
import type {
  ImportFileDescriptor,
  ImportWorkflowResult,
} from '../import/types'
import { createLocalLlamaExtractor } from './local-llama-provider'
import { getLlamaServerBaseUrl, releaseLlamaServer } from './llama-runtime'

export async function runLocalImportWorkflow(
  files: ImportFileDescriptor[],
  signal?: AbortSignal,
): Promise<ImportWorkflowResult> {
  const config = getLocalAiImportConfig()
  const baseUrl = await getLlamaServerBaseUrl(config, signal)

  try {
    return await runImportWorkflow(
      files,
      createLocalLlamaExtractor(baseUrl, config, signal),
    )
  } finally {
    releaseLlamaServer(config)
  }
}
