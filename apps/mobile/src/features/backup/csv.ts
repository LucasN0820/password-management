import type { BackupEntry } from './types';

/** Standard column order, compatible with mainstream password managers. */
export const CSV_COLUMNS = [
  'title',
  'username',
  'password',
  'url',
  'notes',
] as const;

type CsvColumn = (typeof CSV_COLUMNS)[number];

/** Quote a CSV field if it contains a delimiter, quote, or newline. */
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/**
 * Serialize entries to a CSV string with a header row. Uses CRLF line endings
 * for the widest spreadsheet/manager compatibility (RFC 4180).
 */
export function serializeCsv(entries: BackupEntry[]): string {
  const rows = [CSV_COLUMNS.join(',')];
  for (const entry of entries) {
    rows.push(
      [
        entry.title,
        entry.username,
        entry.password,
        entry.url ?? '',
        entry.notes ?? '',
      ]
        .map(escapeField)
        .join(',')
    );
  }
  return rows.join('\r\n');
}

/**
 * Parse a single CSV line into fields, honoring quoted fields with escaped
 * quotes (`""`) and embedded delimiters/newlines-within-quotes are handled by
 * {@link parseCsv} which tokenizes the whole document.
 */
function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field = `${field  }"`;
          i = i + 2;
          continue;
        }
        inQuotes = false;
        i = i + 1;
        continue;
      }
      field = field + char;
      i = i + 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i = i + 1;
      continue;
    }
    if (char === ',') {
      pushField();
      i = i + 1;
      continue;
    }
    if (char === '\r') {
      // Swallow CRLF as a single break.
      if (text[i + 1] === '\n') i = i + 1;
      pushRow();
      i = i + 1;
      continue;
    }
    if (char === '\n') {
      pushRow();
      i = i + 1;
      continue;
    }
    field = field + char;
    i = i + 1;
  }
  // Flush trailing field/row unless the document ended on a clean break.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }
  return rows;
}

/**
 * Parse a CSV document (with header row) into backup entries. Unknown columns
 * are ignored; missing columns default to empty. Returns an empty array for
 * blank input.
 */
export function parseCsv(text: string): BackupEntry[] {
  const rows = tokenizeCsv(text).filter(
    row => !(row.length === 1 && row[0] === '')
  );
  if (rows.length === 0) return [];

  const header = (rows[0] ?? []).map(cell => cell.trim().toLowerCase());
  const indexOf = (column: CsvColumn) => header.indexOf(column);
  const titleIdx = indexOf('title');
  const usernameIdx = indexOf('username');
  const passwordIdx = indexOf('password');
  const urlIdx = indexOf('url');
  const notesIdx = indexOf('notes');

  const at = (cells: string[], index: number) =>
    index >= 0 ? (cells[index] ?? '') : '';

  const entries: BackupEntry[] = [];
  for (let r = 1; r < rows.length; r = r + 1) {
    const cells = rows[r] ?? [];
    const title = at(cells, titleIdx).trim();
    const username = at(cells, usernameIdx);
    const password = at(cells, passwordIdx);
    const url = at(cells, urlIdx).trim();
    const notes = at(cells, notesIdx);
    // Skip wholly empty rows.
    if (!title && !username && !password && !url && !notes) continue;
    entries.push({
      title,
      username,
      password,
      url: url || null,
      notes: notes || null,
      category: 'all',
      isFavorite: false,
      icon: null,
    });
  }
  return entries;
}
