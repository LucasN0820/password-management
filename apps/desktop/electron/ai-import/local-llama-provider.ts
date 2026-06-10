import { z } from 'zod';
import {
  buildCredentialMessages,
  type ImportCandidateDraft,
  type ImportWorkflowContext,
  parseCredentialCandidates,
  type ParsedImageFile,
  type ParsedImportFile,
  type ParsedTextFile,
} from '@repo/ai-import-core';
import type { LocalAiImportConfig } from '../settings';

const llamaResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable(),
      }),
    })
  ),
});

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
    signal,
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

  return content;
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
    const content = await createJsonCompletion(
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
  return async (file: ParsedImportFile, context: ImportWorkflowContext) =>
    { return file.kind === 'image'
      ? extractCredentialsFromImageFile(file)
      : extractCredentialsFromTextFile(file, baseUrl, config, context, signal) };
}
