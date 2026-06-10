import { z } from 'zod';
import type { ImportCandidateDraft } from './types';

export const credentialResponseSchema = z.object({
  candidates: z.array(
    z.object({
      title: z.string().default(''),
      username: z.string().default(''),
      password: z.string().default(''),
      url: z.string().nullable().default(null),
      notes: z.string().nullable().default(null),
      confidence: z.number().min(0).max(1).default(0.5),
      sourceExcerpt: z.string().default(''),
    })
  ),
});

export const credentialJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          username: { type: 'string' },
          password: { type: 'string' },
          url: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          sourceExcerpt: { type: 'string' },
        },
        required: [
          'title',
          'username',
          'password',
          'url',
          'notes',
          'confidence',
          'sourceExcerpt',
        ],
      },
    },
  },
  required: ['candidates'],
} as const;

export function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Continue with fallback extraction below.
    }
  }

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) return objectMatch[0];

  throw new Error('Model did not return JSON');
}

export function parseCredentialCandidates(
  text: string,
  fileName: string,
  createId: () => string,
  evidence: readonly string[] = []
): ImportCandidateDraft[] {
  const parsed = credentialResponseSchema.parse(JSON.parse(extractJson(text)));

  return parsed.candidates
    .filter(candidate => {
      if (candidate.password.length === 0) return false;
      if (!evidence.length) return true;
      const excerpt = candidate.sourceExcerpt.trim();
      return Boolean(excerpt && evidence.some(item => item.includes(excerpt)));
    })
    .map(candidate => ({
      id: createId(),
      sourceFile: fileName,
      title:
        candidate.title.trim() ||
        candidate.url ||
        candidate.username ||
        fileName,
      username: candidate.username.trim(),
      password: candidate.password,
      url: candidate.url?.trim() || null,
      notes: candidate.notes?.trim() || null,
      confidence: candidate.confidence,
      sourceExcerpt: candidate.sourceExcerpt.trim(),
    }));
}
