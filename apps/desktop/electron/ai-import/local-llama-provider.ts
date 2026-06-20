import { z } from 'zod';
import {
  buildCredentialMessages,
  extractJson,
  type ImportCandidateDraft,
  type ImportWorkflowContext,
  parseCredentialCandidates,
  type ParsedImageFile,
  type ParsedImportFile,
  type ParsedTextFile,
} from '@repo/ai-import-core';
import type { LocalAiImportConfig } from '../settings';

const llamaResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable(),
        }),
      })
    )
    .min(1),
});

const strictCredentialResponseSchema = z
  .object({
    candidates: z.array(
      z
        .object({
          title: z.string(),
          username: z.string(),
          password: z.string(),
          url: z.string().nullable(),
          notes: z.string().nullable(),
          confidence: z.number().min(0).max(1),
          sourceExcerpt: z.string(),
        })
        .strict()
    ),
  })
  .strict();

const LOCAL_LLM_REQUEST_TIMEOUT_MS = 30_000;
const LOCAL_LLM_MAX_ATTEMPTS = 3;

export function parseLocalLlamaContent(content: string) {
  return strictCredentialResponseSchema.parse(JSON.parse(extractJson(content)));
}

function requestSignal(signal?: AbortSignal) {
  const timeoutSignal = AbortSignal.timeout(LOCAL_LLM_REQUEST_TIMEOUT_MS);
  if (!signal) {return timeoutSignal;}
  return AbortSignal.any([signal, timeoutSignal]);
}

async function createJsonCompletion(
  baseUrl: string,
  config: LocalAiImportConfig,
  messages: ReturnType<typeof buildCredentialMessages>,
  signal?: AbortSignal
) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma-4-26B-A4B-it',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: config.maxTokens,
      stream: false,
    }),
    signal: requestSignal(signal),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Local llama.cpp returned ${response.status}${
        detail ? `: ${detail}` : ''
      }`
    );
  }

  const parsedResponse = llamaResponseSchema.parse(await response.json());
  const content = parsedResponse.choices[0]?.message.content;
  if (!content) {
    throw new Error('Local llama.cpp returned empty content');
  }

  parseLocalLlamaContent(content);

  return content;
}

async function createJsonCompletionWithRetry(
  baseUrl: string,
  config: LocalAiImportConfig,
  messages: ReturnType<typeof buildCredentialMessages>,
  signal?: AbortSignal
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= LOCAL_LLM_MAX_ATTEMPTS; attempt = attempt + 1) {
    if (signal?.aborted) {throw new Error('Local extraction was cancelled');}
    try {
      return await createJsonCompletion(baseUrl, config, messages, signal);
    } catch (error) {
      lastError = error;
      if (signal?.aborted || attempt === LOCAL_LLM_MAX_ATTEMPTS) {break;}
      await new Promise(resolve => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError;
}

async function extractCredentialsFromTextFile(
  file: ParsedTextFile,
  baseUrl: string,
  config: LocalAiImportConfig,
  context: ImportWorkflowContext,
  signal?: AbortSignal
) {
  if (file.prefilledCandidates.length > 0) {
    return file.prefilledCandidates;
  }

  if (!file.text.trim()) {
    return [];
  }

  try {
    const content = await createJsonCompletionWithRetry(
      baseUrl,
      config,
      buildCredentialMessages(file),
      signal
    );
    return parseCredentialCandidates(
      content,
      file.file.name,
      context.createId,
      file.excerpts
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown local extraction error';
    throw new Error(
      `Local extraction failed for ${file.file.name}: ${message}`
    );
  }
}

function extractCredentialsFromImageFile(
  file: ParsedImageFile
): Promise<ImportCandidateDraft[]> {
  throw new Error(
    `Image import is not supported by the local text provider for ${file.file.name}`
  );
}

export function createLocalLlamaExtractor(
  baseUrl: string,
  config: LocalAiImportConfig,
  signal?: AbortSignal
) {
  return async (file: ParsedImportFile, context: ImportWorkflowContext) => {
    return file.kind === 'image'
      ? extractCredentialsFromImageFile(file)
      : extractCredentialsFromTextFile(file, baseUrl, config, context, signal);
  };
}
