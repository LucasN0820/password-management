import { randomUUID } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type {
  ImportCandidateDraft,
  ParsedImageFile,
  ParsedTextFile,
} from './types'

type MessageContentBlock = Anthropic.Messages.Message['content'][number]
type TextContentBlock = Extract<MessageContentBlock, { type: 'text' }>
type SupportedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'
const EXTRACTION_MODEL = 'claude-sonnet-4-20250514'

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

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('AI_IMPORT_KEY is not configured')
  }

  return new Anthropic({ apiKey })
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

  if (!trimmed) {
    throw new Error('Model did not return JSON')
  }

  return trimmed
}

function isTextContentBlock(block: MessageContentBlock): block is TextContentBlock {
  return block.type === 'text'
}

function getTextResponse(content: Anthropic.Messages.Message['content']) {
  return content
    .filter(isTextContentBlock)
    .map(block => block.text)
    .join('\n')
}

function toSupportedImageMimeType(mimeType: string): SupportedImageMimeType {
  if (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/png' ||
    mimeType === 'image/webp'
  ) {
    return mimeType
  }

  throw new Error(`Unsupported image mime type: ${mimeType}`)
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

export async function extractCredentialsFromTextFile(file: ParsedTextFile) {
  if (file.prefilledCandidates.length > 0) {
    return file.prefilledCandidates
  }

  if (!file.text.trim()) {
    return []
  }

  const client = getClient()
  const prompt = `
You are extracting password-manager records from imported files.

Return strict JSON with this exact shape:
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
- Output JSON only, with no commentary.

File: ${file.file.name}

Evidence excerpts:
${file.excerpts.map((excerpt, index) => `Excerpt ${index + 1}:\n${excerpt}`).join('\n\n')}
`

  try {
    const response = await client.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1400,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const parsed = credentialSchema.parse(
      JSON.parse(extractJson(getTextResponse(response.content))),
    )
    return buildCandidateDrafts(file.file.name, parsed.candidates)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Anthropic extraction error'
    throw new Error(`Anthropic extraction failed for ${file.file.name}: ${message}`)
  }
}

export async function extractCredentialsFromImageFile(file: ParsedImageFile) {
  const client = getClient()
  const mediaType = toSupportedImageMimeType(file.mimeType)

  try {
    const response = await client.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1400,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract password-manager records from this image. Return strict JSON only using this shape:
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
- Only include records with clear credential evidence.
- If there is no password, do not return the record.
- Keep sourceExcerpt short and grounded in the image.
- Output JSON only.`,
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: file.base64,
              },
            },
          ],
        },
      ],
    })

    const parsed = credentialSchema.parse(
      JSON.parse(extractJson(getTextResponse(response.content))),
    )
    return buildCandidateDrafts(file.file.name, parsed.candidates)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Anthropic image extraction error'
    throw new Error(`Anthropic image extraction failed for ${file.file.name}: ${message}`)
  }
}
