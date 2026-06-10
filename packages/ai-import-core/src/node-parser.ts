import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import {
  isPortableTextExtension,
  normalizeWhitespace,
  parsePortableTextFile,
  selectRelevantExcerpts,
} from './text';
import type {
  ImportFileDescriptor,
  ImportFileParser,
  ImportWorkflowContext,
  ParsedImageFile,
  ParsedImportFile,
  ParsedTextFile,
} from './types';

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const DEFAULT_MAX_IMPORT_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function decodePdfText(value: string) {
  if (!/%[0-9A-Fa-f]{2}/.test(value)) return value;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function extractTextFromPdfBuffer(buffer: Buffer) {
  const parser = new PDFParser(undefined, true);

  return await new Promise<string>((resolve, reject) => {
    parser.on('pdfParser_dataError', error => {
      const parserError = error instanceof Error ? error : error.parserError;
      parser.destroy();
      reject(parserError);
    });

    parser.on('pdfParser_dataReady', pdfData => {
      const text = pdfData.Pages.map(page =>
        page.Texts.map(textBlock =>
          textBlock.R.map(run => decodePdfText(run.T)).join('')
        ).join('\n')
      ).join('\n\n');

      parser.destroy();
      resolve(normalizeWhitespace(text));
    });

    parser.parseBuffer(buffer, 0);
  });
}

async function parseTextFile(
  file: ImportFileDescriptor,
  extension: string,
  context: ImportWorkflowContext
) {
  const buffer = await readFile(file.path);

  if (isPortableTextExtension(extension)) {
    return parsePortableTextFile(
      file,
      buffer.toString('utf8'),
      context.createId
    );
  }

  if (extension === '.pdf') {
    const text = await extractTextFromPdfBuffer(buffer);
    return {
      kind: 'text',
      file,
      text,
      excerpts: selectRelevantExcerpts(text),
      prefilledCandidates: [],
    } satisfies ParsedTextFile;
  }

  if (extension === '.docx') {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = normalizeWhitespace(parsed.value);
    return {
      kind: 'text',
      file,
      text,
      excerpts: selectRelevantExcerpts(text),
      prefilledCandidates: [],
    } satisfies ParsedTextFile;
  }

  throw new Error(`Unsupported text type: ${extension}`);
}

async function parseImageFile(file: ImportFileDescriptor, extension: string) {
  const buffer = await readFile(file.path);
  const mimeType = IMAGE_MIME_TYPES[extension];

  if (!mimeType) throw new Error(`Unsupported image type: ${extension}`);

  return {
    kind: 'image',
    file,
    mimeType,
    base64: buffer.toString('base64'),
  } satisfies ParsedImageFile;
}

export function isSupportedImportExtension(extension: string) {
  const normalized = extension.toLowerCase();
  return (
    isPortableTextExtension(normalized) ||
    normalized === '.pdf' ||
    normalized === '.docx' ||
    normalized in IMAGE_MIME_TYPES
  );
}

export function createNodeImportParser(
  maxFileSizeBytes = DEFAULT_MAX_IMPORT_FILE_SIZE_BYTES
): ImportFileParser {
  return async (file, context) => {
    const extension = file.extension.toLowerCase();

    if (!isSupportedImportExtension(extension)) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    if (file.size > maxFileSizeBytes) {
      throw new Error(
        `File exceeds the ${Math.round(maxFileSizeBytes / (1024 * 1024))}MB import limit`
      );
    }

    if (extension in IMAGE_MIME_TYPES) {
      return parseImageFile(file, extension);
    }

    return parseTextFile(file, extension, context);
  };
}

const defaultNodeParser = createNodeImportParser();

export async function parseImportFile(
  file: ImportFileDescriptor,
  context: ImportWorkflowContext = { createId: randomUUID }
): Promise<ParsedImportFile> {
  return defaultNodeParser(file, context);
}
