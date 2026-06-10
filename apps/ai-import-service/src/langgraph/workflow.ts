import { randomUUID } from 'crypto';
import { runImportWorkflow as runCoreImportWorkflow } from '@repo/ai-import-core';
import { parseImportFile } from '@repo/ai-import-core/node';
import {
  extractCredentialsFromImageFile,
  extractCredentialsFromTextFile,
} from './deepseek';
import type {
  ImportFileDescriptor,
  ImportWorkflowResult,
  ParsedImportFile,
} from './types';

async function extractCredentials(
  file: ParsedImportFile,
  context: Parameters<typeof extractCredentialsFromTextFile>[1]
) {
  return file.kind === 'image'
    ? extractCredentialsFromImageFile(file)
    : extractCredentialsFromTextFile(file, context);
}

export async function runImportWorkflow(
  files: ImportFileDescriptor[]
): Promise<ImportWorkflowResult> {
  return runCoreImportWorkflow(files, {
    parseFile: parseImportFile,
    extractCandidates: extractCredentials,
    createId: randomUUID,
  });
}
