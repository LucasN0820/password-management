/**
 * Pure password sorting. Kept free of native modules so it can be unit tested,
 * and Hermes-safe (no `Array#toSorted`).
 */

export type SortKey = 'name' | 'created' | 'updated';

export const SORT_KEYS: readonly SortKey[] = ['updated', 'created', 'name'];

interface Sortable {
  title: string;
  created_at: string;
  updated_at: string;
}

// SQLite timestamps are `YYYY-MM-DD HH:MM:SS` (UTC), so lexical compare == chronological.
const comparators: Record<SortKey, (a: Sortable, b: Sortable) => number> = {
  name: (a, b) => a.title.localeCompare(b.title),
  created: (a, b) => b.created_at.localeCompare(a.created_at),
  updated: (a, b) => b.updated_at.localeCompare(a.updated_at),
};

/** Returns a new array sorted by the given key (defaults to `updated`). */
export function sortPasswords<T extends Sortable>(
  list: readonly T[],
  key: SortKey
): T[] {
  const comparator = comparators[key] ?? comparators.updated;
  // `[...list]` is a fresh copy, so in-place sort is safe; Hermes lacks toSorted.
  // eslint-disable-next-line unicorn/no-array-sort
  return [...list].sort(comparator);
}
