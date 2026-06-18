// Pure, dependency-free password-strength + vault-health helpers.
//
// These functions take plain data (strings / arrays of entries) so they can be
// unit-tested without any native (expo-sqlite / react-native) imports, and run
// efficiently over large vaults entirely in memory — no network, ever.

export type StrengthLevel = 'weak' | 'medium' | 'strong';

/**
 * Scores a password 0-6 by length tiers and character-class diversity.
 * Mirrors the inline scorer the generator screen used, generalized here.
 */
export function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  // Any non-alphanumeric character counts as a symbol class.
  if (/[^A-Z0-9]/i.test(password)) score++;
  return score;
}

/** Classifies a password: score 0-2 weak, 3-4 medium, 5-6 strong. */
export function classifyStrength(password: string): StrengthLevel {
  const score = scorePassword(password);
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

/** True when the password is classified as weak (low strength). */
export function isWeak(password: string): boolean {
  return classifyStrength(password) === 'weak';
}

// ---------------------------------------------------------------------------
// Vault-health auditing
// ---------------------------------------------------------------------------

/** Minimal shape the audit needs — keeps it decoupled from the DB Password type. */
export interface AuditEntry {
  id: number;
  password: string;
  /** ISO / SQL timestamp string (or null) for the last update. */
  updated_at?: string | null;
}

/** One year in milliseconds — the default "stale" threshold. */
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface VaultHealth<T extends AuditEntry> {
  total: number;
  weak: T[];
  /** Entries whose plaintext password is shared with at least one other entry. */
  reused: T[];
  /** Entries not updated within `staleMs`. */
  old: T[];
}

/**
 * Audits a list of decrypted entries in a single set of linear passes.
 *
 * - weak: classifyStrength returns 'weak'.
 * - reused: same non-empty plaintext password shared by 2+ entries.
 * - old: updated_at older than `now - staleMs`. Entries without a parseable timestamp are treated as not-stale to avoid false positives.
 *
 * Efficient for large vaults: O(n) grouping via a Map, no nested scans.
 */
export function auditVault<T extends AuditEntry>(
  entries: T[],
  now: number = Date.now(),
  staleMs: number = ONE_YEAR_MS
): VaultHealth<T> {
  const weak: T[] = [];
  const old: T[] = [];

  // Group by plaintext password to detect reuse in one pass.
  const byPassword = new Map<string, T[]>();
  for (const entry of entries) {
    if (isWeak(entry.password)) weak.push(entry);

    if (entry.password) {
      const group = byPassword.get(entry.password);
      if (group) {
        group.push(entry);
      } else {
        byPassword.set(entry.password, [entry]);
      }
    }

    const updatedMs = parseTimestamp(entry.updated_at);
    if (updatedMs !== null && now - updatedMs > staleMs) {
      old.push(entry);
    }
  }

  const reused: T[] = [];
  for (const group of byPassword.values()) {
    if (group.length > 1) {
      for (const entry of group) reused.push(entry);
    }
  }

  return { total: entries.length, weak, reused, old };
}

/** Parses a SQL/ISO timestamp string into epoch ms, or null when unparseable. */
function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  // SQLite CURRENT_TIMESTAMP yields "YYYY-MM-DD HH:MM:SS" (UTC, space-separated).
  // Date.parse needs a 'T' separator and a zone to read it as UTC reliably.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value;
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? null : ms;
}
