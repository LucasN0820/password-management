// Orchestration for scanning a whole vault for breached passwords. Kept pure by
// taking the per-password lookup as an injected function, so it can be tested
// without expo-crypto or the network.

import type { BreachLookup } from './lookup';

/** Minimal entry shape the scan needs — decoupled from the DB Password type. */
export interface BreachScanEntry {
  id: number;
  password: string;
}

/** Result of scanning the vault. */
export interface BreachScanResult<T extends BreachScanEntry> {
  /** Entries found in at least one known breach. */
  breached: T[];
  /** Breach count keyed by entry id (only breached entries are present). */
  counts: Record<number, number>;
  /** At least one lookup failed (offline / server error) — results are partial. */
  partial: boolean;
}

/**
 * Scans entries by looking each password up via `lookup`. Distinct passwords
 * are de-duplicated so the same plaintext is only hashed/fetched once. The
 * `lookup` is expected to be self-caching by hash prefix.
 *
 * Sequential by design: HIBP is a courtesy free service and the vault is small;
 * this keeps request volume gentle and ordering deterministic.
 */
export async function scanVault<T extends BreachScanEntry>(
  entries: T[],
  lookup: (password: string) => Promise<BreachLookup>
): Promise<BreachScanResult<T>> {
  const byPassword = new Map<string, BreachLookup>();
  const breached: T[] = [];
  const counts: Record<number, number> = {};
  let partial = false;

  for (const entry of entries) {
    if (!entry.password) continue;
    let result = byPassword.get(entry.password);
    if (result === undefined) {
      result = await lookup(entry.password);
      byPassword.set(entry.password, result);
    }
    if (result.failed) {
      partial = true;
      continue;
    }
    if (result.count > 0) {
      breached.push(entry);
      counts[entry.id] = result.count;
    }
  }

  return { breached, counts, partial };
}
