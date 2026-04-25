import { randomUUID } from 'crypto'
import { z } from 'zod'
import type {
  ImportCandidateDraft,
  ParsedImageFile,
  ParsedTextFile,
} from './types'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_EXTRACTION_MODEL = 'deepseek-v4-pro'

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

const deepSeekResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable(),
      }),
    }),
  ),
})

function getApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  return apiKey
}

function getModel() {
  return process.env.DEEPSEEK_MODEL || DEFAULT_EXTRACTION_MODEL
}

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
      title: candidate.title.trim() || candidate.url || candidate.username || fileName,
      username: candidate.username.trim(),
      password: candidate.password.trim(),
      url: candidate.url?.trim() || null,
      notes: candidate.notes?.trim() || null,
      confidence: candidate.confidence,
      sourceExcerpt: candidate.sourceExcerpt.trim(),
    }))
}

async function createJsonCompletion(systemPrompt: string, userPrompt: string) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 2000,
      stream: false,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `DeepSeek API returned ${response.status}${detail ? `: ${detail}` : ''}`,
    )
  }

  const parsedResponse = deepSeekResponseSchema.parse(await response.json())
  const content = parsedResponse.choices[0]?.message.content
  if (!content) {
    throw new Error('DeepSeek returned empty content')
  }

  return credentialSchema.parse(JSON.parse(extractJson(content)))
}

export async function extractCredentialsFromTextFile(file: ParsedTextFile) {
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
- Output valid JSON only.`

  const userPrompt = `File: ${file.file.name}

Evidence excerpts:
${file.excerpts.map((excerpt, index) => `Excerpt ${index + 1}:\n${excerpt}`).join('\n\n')}`

  try {
    const parsed = await createJsonCompletion(systemPrompt, userPrompt)
    return buildCandidateDrafts(file.file.name, parsed.candidates)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown DeepSeek extraction error'
    throw new Error(`DeepSeek extraction failed for ${file.file.name}: ${message}`)
  }
}

export async function extractCredentialsFromImageFile(
  file: ParsedImageFile,
): Promise<ImportCandidateDraft[]> {
  throw new Error(
    `Image import is not supported by the current DeepSeek provider for ${file.file.name}`,
  )
}
