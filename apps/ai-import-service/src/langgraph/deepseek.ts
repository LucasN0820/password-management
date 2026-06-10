import { z } from 'zod';
import {
  buildCredentialMessages,
  parseCredentialCandidates,
  type ImportCandidateDraft,
  type ImportWorkflowContext,
  ParsedImageFile,
  ParsedTextFile,
} from '@repo/ai-import-core';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_EXTRACTION_MODEL = 'deepseek-v4-pro';

const deepSeekResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable(),
      }),
    })
  ),
});

function getApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  return apiKey;
}

function getModel() {
  return process.env.DEEPSEEK_MODEL || DEFAULT_EXTRACTION_MODEL;
}

async function createJsonCompletion(
  messages: ReturnType<typeof buildCredentialMessages>
) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 2000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `DeepSeek API returned ${response.status}${detail ? `: ${detail}` : ''}`
    );
  }

  const parsedResponse = deepSeekResponseSchema.parse(await response.json());
  const content = parsedResponse.choices[0]?.message.content;
  if (!content) {
    throw new Error('DeepSeek returned empty content');
  }

  return content;
}

export async function extractCredentialsFromTextFile(
  file: ParsedTextFile,
  context: ImportWorkflowContext
) {
  if (file.prefilledCandidates.length > 0) {
    return file.prefilledCandidates;
  }

  if (!file.text.trim()) {
    return [];
  }

  try {
    const content = await createJsonCompletion(buildCredentialMessages(file));
    return parseCredentialCandidates(
      content,
      file.file.name,
      context.createId,
      file.excerpts
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown DeepSeek extraction error';
    throw new Error(
      `DeepSeek extraction failed for ${file.file.name}: ${message}`
    );
  }
}

export async function extractCredentialsFromImageFile(
  file: ParsedImageFile
): Promise<ImportCandidateDraft[]> {
  throw new Error(
    `Image import is not supported by the current DeepSeek provider for ${file.file.name}`
  );
}
