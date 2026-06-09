import { runImportWorkflow as runCoreImportWorkflow } from '@repo/ai-import-core'
import { extractCredentialsFromImageFile, extractCredentialsFromTextFile } from './deepseek'
import type {
  ImportFileDescriptor,
  ImportWorkflowResult,
  ParsedImportFile,
} from './types'

async function extractCredentials(file: ParsedImportFile) {
  return file.kind === 'image'
    ? extractCredentialsFromImageFile(file)
    : extractCredentialsFromTextFile(file)
}

export async function runImportWorkflow(
  files: ImportFileDescriptor[],
): Promise<ImportWorkflowResult> {
  return runCoreImportWorkflow(files, extractCredentials)
}
