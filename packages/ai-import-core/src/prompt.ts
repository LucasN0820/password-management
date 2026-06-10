import type { ParsedTextFile } from './types';

export const CREDENTIAL_SYSTEM_PROMPT = `You extract password-manager records from imported files.

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
- Do not invent, correct, or complete missing fields.
- Preserve password characters exactly as written.
- Keep sourceExcerpt short and copied from the evidence context.
- Support English and Chinese labels including username, password, account, email, 账号, 密码, 邮箱, 网址, 备注.
- Output valid JSON only.`;

export function buildCredentialMessages(file: ParsedTextFile) {
  return [
    { role: 'system', content: CREDENTIAL_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `File: ${file.file.name}\n\nEvidence excerpts:\n${file.excerpts
        .map((excerpt, index) => `Excerpt ${index + 1}:\n${excerpt}`)
        .join('\n\n')}`,
    },
  ] as const;
}
