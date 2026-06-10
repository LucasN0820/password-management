import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ParsedTextFile,
} from './types';

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);
const CSV_STRUCTURED_CONFIDENCE = 0.96;

type CredentialField = 'title' | 'username' | 'password' | 'url' | 'notes';

function fileStem(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

export function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function chunkText(text: string, maxLength = 2200, overlap = 250) {
  const cleanText = normalizeWhitespace(text);
  if (!cleanText) return [];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < cleanText.length) {
    const end = Math.min(cursor + maxLength, cleanText.length);
    chunks.push(cleanText.slice(cursor, end).trim());
    if (end === cleanText.length) break;
    cursor = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean);
}

export function scoreChunk(chunk: string) {
  const lower = chunk.toLowerCase();
  const keywordMatches = [
    'password',
    'username',
    'login',
    'account',
    'email',
    'website',
    'url',
    'credential',
    '账号',
    '密码',
    '邮箱',
  ].reduce((score, keyword) => score + (lower.includes(keyword) ? 2 : 0), 0);

  const urlMatches = (chunk.match(/https?:\/\/[^\s]+/g) ?? []).length;
  const emailMatches = (
    chunk.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
  ).length;
  const separatorMatches = (chunk.match(/[:,=]/g) ?? []).length;

  return keywordMatches + urlMatches * 2 + emailMatches * 2 + separatorMatches;
}

export function selectRelevantExcerpts(text: string, maxExcerpts = 6) {
  return chunkText(text)
    .map(chunk => ({ chunk, score: scoreChunk(chunk) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, maxExcerpts)
    .map(item => item.chunk);
}

function detectCsvField(header: string): CredentialField | null {
  const normalized = header.trim().toLowerCase();

  if (
    [
      'title',
      'name',
      'service',
      'site',
      'website name',
      '标题',
      '名称',
      '服务',
    ].includes(normalized)
  ) {
    return 'title';
  }
  if (
    ['username', 'user', 'login', 'account', 'email', '邮箱', '账号'].includes(
      normalized
    )
  ) {
    return 'username';
  }
  if (['password', 'pass', 'secret', '密码'].includes(normalized)) {
    return 'password';
  }
  if (
    ['url', 'website', 'site url', 'login url', '网址'].includes(normalized)
  ) {
    return 'url';
  }
  if (['notes', 'memo', 'remark', '备注'].includes(normalized)) {
    return 'notes';
  }

  return null;
}

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function parseCsvRecords(csvText: string) {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(line => line.trim().length > 0);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]!);
  const records: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const values = parseCsvLine(lines[rowIndex]!);
    const record: Record<string, string> = {};
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      record[headers[columnIndex]!] = values[columnIndex] ?? '';
    }
    records.push(record);
  }

  return records;
}

export function buildCsvPrefilledCandidates(
  file: ImportFileDescriptor,
  csvText: string,
  createId: () => string
) {
  const records = parseCsvRecords(csvText);

  if (!records.length) return [];

  const fieldMap = new Map<string, CredentialField>();
  for (const header of Object.keys(records[0] ?? {})) {
    const field = detectCsvField(header);
    if (field) fieldMap.set(header, field);
  }

  if (!Array.from(fieldMap.values()).includes('password')) return [];

  const candidates: ImportCandidateDraft[] = [];

  for (const [rowIndex, record] of records.entries()) {
    const resolved: Partial<Record<CredentialField, string>> = {};

    for (const [header, value] of Object.entries(record)) {
      const field = fieldMap.get(header);
      if (field && value) resolved[field] = value;
    }

    if (resolved.password === undefined || resolved.password.length === 0)
      continue;

    candidates.push({
      id: createId(),
      sourceFile: file.name,
      title:
        resolved.title ||
        resolved.url ||
        resolved.username ||
        `${fileStem(file.name)} ${rowIndex + 1}`,
      username: resolved.username ?? '',
      password: resolved.password,
      url: resolved.url ?? null,
      notes: resolved.notes ?? null,
      confidence: CSV_STRUCTURED_CONFIDENCE,
      sourceExcerpt: Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ')
        .slice(0, 280),
    });
  }

  return candidates;
}

export function parsePortableTextFile(
  file: ImportFileDescriptor,
  text: string,
  createId: () => string
): ParsedTextFile {
  const extension = file.extension.toLowerCase();
  const normalizedText =
    extension === '.csv' ? text : normalizeWhitespace(text);

  return {
    kind: 'text',
    file,
    text: normalizedText,
    excerpts: selectRelevantExcerpts(normalizedText),
    prefilledCandidates:
      extension === '.csv'
        ? buildCsvPrefilledCandidates(file, normalizedText, createId)
        : [],
  };
}

export function isPortableTextExtension(extension: string) {
  const normalized = extension.toLowerCase();
  return normalized === '.csv' || TEXT_EXTENSIONS.has(normalized);
}
