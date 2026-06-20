import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import type {
  ImportFileDescriptor,
  ImportWorkflowResult,
} from '@repo/ai-import-core';

export const MAX_REMOTE_IMPORT_FILE_BYTES = 25 * 1024 * 1024;
export const REMOTE_IMPORT_OVERALL_TIMEOUT_MS = 60_000;
export const REMOTE_IMPORT_REQUEST_TIMEOUT_MS = 15_000;

const MIME_BY_EXTENSION = {
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.txt': 'text/plain',
} as const;

type SupportedExtension = keyof typeof MIME_BY_EXTENSION;

// Error subclasses are required so callers can distinguish safe public codes.
// eslint-disable-next-line no-restricted-syntax/noClasses
export class RemoteImportPublicError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'RemoteImportPublicError';
  }
}

function supportedExtension(file: ImportFileDescriptor): SupportedExtension {
  const extension = (file.extension || extname(file.name)).toLowerCase();
  if (!(extension in MIME_BY_EXTENSION)) {
    throw new RemoteImportPublicError('AI_IMPORT_FILE_TYPE_NOT_ALLOWED');
  }
  return extension as SupportedExtension;
}

export function validateRemoteImportDescriptor(file: ImportFileDescriptor) {
  const extension = supportedExtension(file);
  if (file.size <= 0 || file.size > MAX_REMOTE_IMPORT_FILE_BYTES) {
    throw new RemoteImportPublicError('AI_IMPORT_FILE_SIZE_INVALID');
  }
  return {
    extension,
    mimeType: MIME_BY_EXTENSION[extension],
    uploadName: `${randomUUID()}${extension}`,
  };
}

export function validateRemoteImportContent(
  content: Uint8Array,
  extension: SupportedExtension
) {
  if (
    content.byteLength <= 0 ||
    content.byteLength > MAX_REMOTE_IMPORT_FILE_BYTES
  ) {
    throw new RemoteImportPublicError('AI_IMPORT_FILE_SIZE_INVALID');
  }

  const isPdf =
    content.length >= 5 &&
    Buffer.from(content.subarray(0, 5)).toString() === '%PDF-';
  const isZip =
    content.length >= 4 &&
    content[0] === 0x50 &&
    content[1] === 0x4b &&
    (content[2] === 0x03 || content[2] === 0x05 || content[2] === 0x07) &&
    (content[3] === 0x04 || content[3] === 0x06 || content[3] === 0x08);
  const looksLikeText = !content.subarray(0, 8192).includes(0);

  if (
    (extension === '.pdf' && !isPdf) ||
    (extension === '.docx' && !isZip) ||
    (!['.pdf', '.docx'].includes(extension) && !looksLikeText)
  ) {
    throw new RemoteImportPublicError('AI_IMPORT_FILE_TYPE_NOT_ALLOWED');
  }
}

function combineSignals(signals: AbortSignal[]) {
  return AbortSignal.any(signals);
}

async function requestWithTimeout(
  input: string,
  init: RequestInit,
  workflowSignal: AbortSignal,
  fetchImpl: typeof fetch
) {
  const requestController = new AbortController();
  const timer = setTimeout(
    () => { requestController.abort(); },
    REMOTE_IMPORT_REQUEST_TIMEOUT_MS
  );
  try {
    return await fetchImpl(input, {
      ...init,
      signal: combineSignals([workflowSignal, requestController.signal]),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function abortableDelay(ms: number, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new RemoteImportPublicError('AI_IMPORT_CANCELLED'));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new RemoteImportPublicError('AI_IMPORT_CANCELLED'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

interface RemoteImportOptions {
  files: ImportFileDescriptor[];
  serviceUrl: string;
  secret: string;
  signal: AbortSignal;
  onJobCreated: (jobId: string) => void;
  fetchImpl?: typeof fetch;
}

export async function runRemoteImportWorkflow({
  files,
  serviceUrl,
  secret,
  signal,
  onJobCreated,
  fetchImpl = fetch,
}: RemoteImportOptions): Promise<ImportWorkflowResult> {
  const overallController = new AbortController();
  const overallTimer = setTimeout(
    () => { overallController.abort(); },
    REMOTE_IMPORT_OVERALL_TIMEOUT_MS
  );
  const workflowSignal = combineSignals([signal, overallController.signal]);

  try {
    const formData = new FormData();
    for (const file of files) {
      const metadata = validateRemoteImportDescriptor(file);
      const currentStats = await stat(file.path);
      if (
        currentStats.size !== file.size ||
        currentStats.size > MAX_REMOTE_IMPORT_FILE_BYTES
      ) {
        throw new RemoteImportPublicError('AI_IMPORT_FILE_SIZE_INVALID');
      }
      const buffer = await readFile(file.path);
      validateRemoteImportContent(buffer, metadata.extension);
      formData.append(
        'files',
        new Blob([buffer], { type: metadata.mimeType }),
        metadata.uploadName
      );
    }

    const createResponse = await requestWithTimeout(
      `${serviceUrl}/import/jobs`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
        body: formData,
      },
      workflowSignal,
      fetchImpl
    );
    if (!createResponse.ok) {
      const detail = await createResponse.text().catch(() => '');
      throw new Error(
        `Create import job failed (${createResponse.status}): ${detail}`
      );
    }

    const createBody = (await createResponse.json()) as { jobId?: unknown };
    if (typeof createBody.jobId !== 'string' || !createBody.jobId) {
      throw new Error('Create import job returned an invalid job id');
    }
    onJobCreated(createBody.jobId);

    while (!workflowSignal.aborted) {
      const statusResponse = await requestWithTimeout(
        `${serviceUrl}/import/jobs/${encodeURIComponent(createBody.jobId)}`,
        { headers: { Authorization: `Bearer ${secret}` } },
        workflowSignal,
        fetchImpl
      );
      if (!statusResponse.ok) {
        throw new Error(
          `Import status request failed (${statusResponse.status})`
        );
      }

      const job = (await statusResponse.json()) as {
        status?: unknown;
        result?: ImportWorkflowResult;
        error?: unknown;
      };
      if (job.status === 'completed' && job.result) {return job.result;}
      if (job.status === 'failed') {throw new Error('Remote import job failed');}
      if (job.status === 'cancelled') {
        throw new RemoteImportPublicError('AI_IMPORT_CANCELLED');
      }
      if (!['queued', 'processing', 'completed'].includes(String(job.status))) {
        throw new Error('Remote import job returned an invalid status');
      }
      await abortableDelay(1000, workflowSignal);
    }

    throw new RemoteImportPublicError(
      signal.aborted ? 'AI_IMPORT_CANCELLED' : 'AI_IMPORT_TIMEOUT'
    );
  } catch (error) {
    if (error instanceof RemoteImportPublicError) {throw error;}
    if (workflowSignal.aborted) {
      throw new RemoteImportPublicError(
        signal.aborted ? 'AI_IMPORT_CANCELLED' : 'AI_IMPORT_TIMEOUT'
      );
    }
    throw error;
  } finally {
    clearTimeout(overallTimer);
  }
}
