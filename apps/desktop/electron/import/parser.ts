import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import { basename, extname } from 'path'
import mammoth from 'mammoth'
import PDFParser from 'pdf2json'
import { parse as parseCsv } from 'csv-parse/sync'
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ParsedImageFile,
  ParsedImportFile,
  ParsedTextFile,
} from './types'

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown'])
const IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

type CredentialField = 'title' | 'username' | 'password' | 'url' | 'notes'
const MAX_IMPORT_FILE_SIZE_BYTES = 25 * 1024 * 1024
const CSV_STRUCTURED_CONFIDENCE = 0.96

function decodePdfText(value: string) {
  if (!/%[0-9A-Fa-f]{2}/.test(value)) {
    return value
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

function chunkText(text: string, maxLength = 2200, overlap = 250) {
  const cleanText = normalizeWhitespace(text)
  if (!cleanText) return []

  const chunks: string[] = []
  let cursor = 0

  while (cursor < cleanText.length) {
    const end = Math.min(cursor + maxLength, cleanText.length)
    chunks.push(cleanText.slice(cursor, end).trim())
    if (end === cleanText.length) break
    cursor = Math.max(0, end - overlap)
  }

  return chunks.filter(Boolean)
}

function scoreChunk(chunk: string) {
  const lower = chunk.toLowerCase()
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
  ].reduce((score, keyword) => score + (lower.includes(keyword) ? 2 : 0), 0)

  const urlMatches = (chunk.match(/https?:\/\/[^\s]+/g) ?? []).length
  const emailMatches = (chunk.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).length
  const separatorMatches = (chunk.match(/[:,=]/g) ?? []).length

  return keywordMatches + urlMatches * 2 + emailMatches * 2 + separatorMatches
}

function selectRelevantExcerpts(text: string, maxExcerpts = 6) {
  const chunks = chunkText(text)
  return chunks
    .map(chunk => ({ chunk, score: scoreChunk(chunk) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, maxExcerpts)
    .map(item => item.chunk)
}

function detectCsvField(header: string): CredentialField | null {
  const normalized = header.trim().toLowerCase()

  if (['title', 'name', 'service', 'site', 'website name'].includes(normalized)) {
    return 'title'
  }
  if (['username', 'user', 'login', 'account', 'email', '邮箱', '账号'].includes(normalized)) {
    return 'username'
  }
  if (['password', 'pass', 'secret', '密码'].includes(normalized)) {
    return 'password'
  }
  if (['url', 'website', 'site url', 'login url', '网址'].includes(normalized)) {
    return 'url'
  }
  if (['notes', 'memo', 'remark', '备注'].includes(normalized)) {
    return 'notes'
  }

  return null
}

function buildCsvPrefilledCandidates(file: ImportFileDescriptor, csvText: string) {
  const records = parseCsv(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[]

  if (!records.length) return []

  const fieldMap = new Map<string, CredentialField>()
  for (const header of Object.keys(records[0] ?? {})) {
    const field = detectCsvField(header)
    if (field) {
      fieldMap.set(header, field)
    }
  }

  const hasPasswordField = Array.from(fieldMap.values()).includes('password')
  if (!hasPasswordField) return []

  const candidates: ImportCandidateDraft[] = []

  for (const [rowIndex, record] of records.entries()) {
    const resolved: Partial<Record<CredentialField, string>> = {}

    for (const [header, value] of Object.entries(record)) {
      const field = fieldMap.get(header)
      if (!field || !value) continue
      resolved[field] = value
    }

    if (!resolved.password) continue

    candidates.push({
      id: randomUUID(),
      sourceFile: file.name,
      title:
        resolved.title ||
        resolved.url ||
        resolved.username ||
        `${basename(file.name, extname(file.name))} ${rowIndex + 1}`,
      username: resolved.username ?? '',
      password: resolved.password,
      url: resolved.url ?? null,
      notes: resolved.notes ?? null,
      // Structured CSV exports are deterministic enough to rank above LLM guesses.
      confidence: CSV_STRUCTURED_CONFIDENCE,
      sourceExcerpt: Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ')
        .slice(0, 280),
    })
  }

  return candidates
}

async function extractTextFromPdfBuffer(buffer: Buffer) {
  const parser = new PDFParser(undefined, true)

  return await new Promise<string>((resolve, reject) => {
    parser.on('pdfParser_dataError', error => {
      const parserError =
        error instanceof Error ? error : error.parserError
      parser.destroy()
      reject(parserError)
    })

    parser.on('pdfParser_dataReady', pdfData => {
      const text = pdfData.Pages
        .map(page =>
          page.Texts.map(textBlock =>
            textBlock.R.map(run => decodePdfText(run.T)).join(''),
          ).join('\n'),
        )
        .join('\n\n')

      parser.destroy()
      resolve(normalizeWhitespace(text))
    })

    parser.parseBuffer(buffer, 0)
  })
}

async function parseTextFile(file: ImportFileDescriptor, extension: string) {
  const buffer = await readFile(file.path)

  if (extension === '.csv') {
    const text = buffer.toString('utf8')
    return {
      kind: 'text',
      file,
      text,
      excerpts: selectRelevantExcerpts(text),
      prefilledCandidates: buildCsvPrefilledCandidates(file, text),
    } satisfies ParsedTextFile
  }

  if (extension === '.pdf') {
    const text = await extractTextFromPdfBuffer(buffer)
    return {
      kind: 'text',
      file,
      text,
      excerpts: selectRelevantExcerpts(text),
      prefilledCandidates: [],
    } satisfies ParsedTextFile
  }

  if (extension === '.docx') {
    const parsed = await mammoth.extractRawText({ buffer })
    const text = normalizeWhitespace(parsed.value)
    return {
      kind: 'text',
      file,
      text,
      excerpts: selectRelevantExcerpts(text),
      prefilledCandidates: [],
    } satisfies ParsedTextFile
  }

  const text = normalizeWhitespace(buffer.toString('utf8'))
  return {
    kind: 'text',
    file,
    text,
    excerpts: selectRelevantExcerpts(text),
    prefilledCandidates: [],
  } satisfies ParsedTextFile
}

async function parseImageFile(file: ImportFileDescriptor, extension: string) {
  const buffer = await readFile(file.path)
  return {
    kind: 'image',
    file,
    mimeType: IMAGE_MIME_TYPES[extension],
    base64: buffer.toString('base64'),
  } satisfies ParsedImageFile
}

export function isSupportedImportExtension(extension: string) {
  return (
    extension === '.csv' ||
    extension === '.pdf' ||
    extension === '.docx' ||
    TEXT_EXTENSIONS.has(extension) ||
    extension in IMAGE_MIME_TYPES
  )
}

export async function parseImportFile(
  file: ImportFileDescriptor,
): Promise<ParsedImportFile> {
  const extension = file.extension.toLowerCase()

  if (!isSupportedImportExtension(extension)) {
    throw new Error(`Unsupported file type: ${extension}`)
  }

  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds the ${Math.round(MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024))}MB import limit`,
    )
  }

  if (extension in IMAGE_MIME_TYPES) {
    return parseImageFile(file, extension)
  }

  return parseTextFile(file, extension)
}
