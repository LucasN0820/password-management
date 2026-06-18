import { describe, expect, it, vi } from 'vitest';
import type { BreachLookup } from '../lookup';
import { scanVault } from '../scan';

const entries = [
  { id: 1, password: 'password' },
  { id: 2, password: 'correct-horse' },
  { id: 3, password: 'password' }, // duplicate of id 1
  { id: 4, password: '' }, // empty — skipped
];

/** Lookup stub mapping plaintext → result. */
function lookupFrom(map: Record<string, BreachLookup>) {
  return vi.fn(
    async (password: string): Promise<BreachLookup> =>
      map[password] ?? { count: 0, failed: false }
  );
}

describe('scanVault', () => {
  it('collects breached entries with their counts', async () => {
    const lookup = lookupFrom({
      password: { count: 9659365, failed: false },
      'correct-horse': { count: 0, failed: false },
    });
    const result = await scanVault(entries, lookup);

    expect(result.breached.map(e => e.id)).toEqual([1, 3]);
    expect(result.counts).toEqual({ 1: 9659365, 3: 9659365 });
    expect(result.partial).toBe(false);
  });

  it('de-duplicates identical passwords (one lookup per distinct value)', async () => {
    const lookup = lookupFrom({
      password: { count: 5, failed: false },
    });
    await scanVault(entries, lookup);

    // 'password' (x2) + 'correct-horse' = 2 distinct lookups; '' is skipped.
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it('marks the scan partial when a lookup fails, without dropping good results', async () => {
    const lookup = lookupFrom({
      password: { count: 5, failed: false },
      'correct-horse': { count: 0, failed: true },
    });
    const result = await scanVault(entries, lookup);

    expect(result.partial).toBe(true);
    expect(result.breached.map(e => e.id)).toEqual([1, 3]);
  });

  it('returns an empty, non-partial result for an all-clean vault', async () => {
    const lookup = lookupFrom({});
    const result = await scanVault(entries, lookup);
    expect(result.breached).toEqual([]);
    expect(result.counts).toEqual({});
    expect(result.partial).toBe(false);
  });
});
