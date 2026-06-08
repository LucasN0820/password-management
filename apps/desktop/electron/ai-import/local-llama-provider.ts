import { randomUUID } from 'crypto'
import { z } from 'zod'
import type {
  ImportCandidateDraft,
  ParsedImageFile,
  ParsedImportFile,
  ParsedTextFile,
} from '@repo/ai-import-core'
import type { LocalAiImportConfig } from '../settings'

const credentialSchema = z.object({
  candidates: z.array(
    z.object({
      title: z.string().default(''),
      username: z.string().default(''),
      password: z.string().default(''),
      url: z.string().nullable().default(null),
      notes: z.string().nullable().default(null),
      confidence: z.number().min(0).max(1).default(0.5),
      sourceExcerpt: z.string().default(''),
    }),
  ),
})

const llamaResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable(),
      }),
    }),
  ),
})

function extractJson(text: string) {
  const trimmed = text.trim()
  if (trimmed) {
    try {
      JSON.parse(trimmed)
      return trimmed
    } catch {
      // Continue with fallback extraction below.
    }
  }

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const objectMatch = text.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) {
    return objectMatch[0]
  }

  throw new Error('Model did not return JSON')
}

function buildCandidateDrafts(
  fileName: string,
  candidates: z.infer<typeof credentialSchema>['candidates'],
): ImportCandidateDraft[] {
  return candidates
    .filter(candidate => candidate.password.trim())
    .map(candidate => ({
      id: randomUUID(),
      sourceFile: fileName,
      title:
        candidate.title.trim() ||
        candidate.url ||
        candidate.username ||
        fileName,
      username: candidate.username.trim(),
      password: candidate.password.trim(),
      url: candidate.url?.trim() || null,
      notes: candidate.notes?.trim() || null,
      confidence: candidate.confidence,
      sourceExcerpt: candidate.sourceExcerpt.trim(),
    }))
}

async function createJsonCompletion(
  baseUrl: string,
  config: LocalAiImportConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma-4-26B-A4B-it',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: config.maxTokens,
      stream: false,
    }),
    signal,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Local llama.cpp returned ${response.status}${
        detail ? `: ${detail}` : ''
      }`,
    )
  }

  const parsedResponse = llamaResponseSchema.parse(await response.json())
  const content = parsedResponse.choices[0]?.message.content
  if (!content) {
    throw new Error('Local llama.cpp returned empty content')
  }

  return credentialSchema.parse(JSON.parse(extractJson(content)))
}

async function extractCredentialsFromTextFile(
  file: ParsedTextFile,
  baseUrl: string,
  config: LocalAiImportConfig,
  signal?: AbortSignal,
) {
  if (file.prefilledCandidates.length > 0) {
    return file.prefilledCandidates
  }

  if (!file.text.trim()) {
    return []
  }

  const systemPrompt = `You extract password-manager records from imported files.

Return JSON only, using this exact JSON shape:
{
  "candidates": [
    {
      "title": "service name",
      "username": "login or email",
      "password": "plaintext password",
      "url": "https://example.com or null",
      "notes": "supporting detail or null",
      "confidence": 0.0,
      "sourceExcerpt": "short evidence excerpt"
    }
  ]
}

Rules:
- Only return records that have clear credential evidence.
- If there is no password, do not include the record.
- Do not invent missing fields.
- Keep sourceExcerpt short and copied from the evidence context.
- Support English and Chinese credential labels such as username, password, account, email, 账号, 密码, 邮箱, 网址, 备注.
- Output valid JSON only.`

  const userPrompt = `File: ${file.file.name}

Evidence excerpts:
${file.excerpts
  .map((excerpt, index) => `Excerpt ${index + 1}:\n${excerpt}`)
  .join('\n\n')}`

  try {
    const parsed = await createJsonCompletion(
      baseUrl,
      config,
      systemPrompt,
      userPrompt,
      signal,
    )
    return buildCandidateDrafts(file.file.name, parsed.candidates)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown local extraction error'
    throw new Error(`Local extraction failed for ${file.file.name}: ${message}`)
  }
}

function extractCredentialsFromImageFile(
  file: ParsedImageFile,
): Promise<ImportCandidateDraft[]> {
  throw new Error(
    `Image import is not supported by the local text provider for ${file.file.name}`,
  )
}

export function createLocalLlamaExtractor(
  baseUrl: string,
  config: LocalAiImportConfig,
  signal?: AbortSignal,
) {
  return async (file: ParsedImportFile) =>
    file.kind === 'image'
      ? extractCredentialsFromImageFile(file)
      : extractCredentialsFromTextFile(file, baseUrl, config, signal)
}
