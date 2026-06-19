import type { Password, PasswordInput } from '@repo/db';
import type { BackupEntry } from './types';

/** Build a stable de-dupe fingerprint from title + username + url. */
export function fingerprintOf(entry: {
  title: string;
  username: string;
  url: string | null;
}): string {
  return [
    entry.title.trim().toLowerCase(),
    entry.username.trim().toLowerCase(),
    (entry.url ?? '').trim().toLowerCase(),
  ].join('\u0000');
}

export interface MergeResult {
  /** Entries that should be inserted (not already present, first-wins). */
  toAdd: PasswordInput[];
  /** Count of imported entries skipped as duplicates. */
  skipped: number;
}

/**
 * Merge imported backup entries against the existing vault, de-duplicating by
 * (title + username + url). Existing rows are never modified; incoming
 * duplicates (against the vault or earlier in the same import) are skipped.
 */
export function mergeEntries(
  incoming: BackupEntry[],
  existing: Pick<Password, 'title' | 'username' | 'url'>[]
): MergeResult {
  const seen = new Set<string>();
  for (const row of existing) {
    seen.add(
      fingerprintOf({
        title: row.title,
        username: row.username,
        url: row.url,
      })
    );
  }

  const toAdd: PasswordInput[] = [];
  let skipped = 0;
  for (const entry of incoming) {
    const key = fingerprintOf(entry);
    if (seen.has(key)) {
      skipped = skipped + 1;
      continue;
    }
    seen.add(key);
    toAdd.push({
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes,
      category: entry.category || 'all',
      isFavorite: entry.isFavorite,
      icon: entry.icon,
      totp_secret: entry.totp_secret ?? null,
    });
  }

  return { toAdd, skipped };
}
