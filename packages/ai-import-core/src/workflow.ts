import { normalizeCandidates } from './normalize';
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportFileResult,
  ImportWorkflowDependencies,
  ImportWorkflowOptions,
  ImportWorkflowResult,
  ParsedImportFile,
} from './types';

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error('Import cancelled');
  }
}

export async function runImportWorkflow(
  files: ImportFileDescriptor[],
  dependencies: ImportWorkflowDependencies,
  options: ImportWorkflowOptions = {}
): Promise<ImportWorkflowResult> {
  const parsedFiles: ParsedImportFile[] = [];
  const candidates: ImportCandidateDraft[] = [];
  const resultMap = new Map<string, ImportFileResult>();
  const warnings: string[] = [];
  const context = {
    createId: dependencies.createId,
    signal: options.signal,
  };

  for (const [index, file] of files.entries()) {
    throwIfAborted(options.signal);
    options.onProgress?.({
      phase: 'parsing',
      completedFiles: index,
      totalFiles: files.length,
      fileName: file.name,
    });

    try {
      parsedFiles.push(await dependencies.parseFile(file, context));
      const result = {
        fileName: file.name,
        extension: file.extension,
        status: 'processed',
        candidateCount: 0,
      } satisfies ImportFileResult;
      resultMap.set(file.path, result);
    } catch (error) {
      throwIfAborted(options.signal);
      const message =
        error instanceof Error ? error.message : 'Unknown file parse error';
      warnings.push(`${file.name}: ${message}`);
      const result = {
        fileName: file.name,
        extension: file.extension,
        status: 'failed',
        candidateCount: 0,
        warning: message,
      } satisfies ImportFileResult;
      resultMap.set(file.path, result);
    }
  }

  for (const [index, parsedFile] of parsedFiles.entries()) {
    throwIfAborted(options.signal);
    options.onProgress?.({
      phase: 'extracting',
      completedFiles: index,
      totalFiles: parsedFiles.length,
      fileName: parsedFile.file.name,
    });

    try {
      const extracted = await dependencies.extractCandidates(
        parsedFile,
        context
      );
      candidates.push(...extracted);
      const result = resultMap.get(parsedFile.file.path);
      if (result) {
        resultMap.set(parsedFile.file.path, {
          ...result,
          candidateCount: extracted.length,
        });
      }
    } catch (error) {
      throwIfAborted(options.signal);
      const message =
        error instanceof Error ? error.message : 'Unknown extraction error';
      warnings.push(`${parsedFile.file.name}: ${message}`);
      const result = resultMap.get(parsedFile.file.path);
      if (result) {
        resultMap.set(parsedFile.file.path, {
          ...result,
          status: 'failed',
          warning: message,
        });
      }
    }
  }

  options.onProgress?.({
    phase: 'normalizing',
    completedFiles: parsedFiles.length,
    totalFiles: parsedFiles.length,
  });

  const normalizedCandidates = normalizeCandidates(candidates);
  options.onProgress?.({
    phase: 'completed',
    completedFiles: files.length,
    totalFiles: files.length,
  });

  return {
    files: Array.from(resultMap.values()),
    candidates: normalizedCandidates,
    warnings,
  };
}
