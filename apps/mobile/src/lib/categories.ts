/**
 * Category helpers. `all` and `favorites` are virtual filters handled by the
 * password store; every other value is a real, user-defined category. A stored
 * `category` of `all` means "uncategorized".
 */

export const UNCATEGORIZED = 'all';
export const VIRTUAL_CATEGORIES: readonly string[] = ['all', 'favorites'];

/** True for a real user-defined category (not `all` / `favorites` / empty). */
export function isCustomCategory(category: string | null | undefined): boolean {
  return Boolean(category) && !VIRTUAL_CATEGORIES.includes(category as string);
}

/** Distinct, sorted custom categories present in the given passwords. */
export function deriveCategories(
  passwords: { category: string }[]
): string[] {
  const custom = passwords
    .map(p => p.category)
    .filter(category => isCustomCategory(category));
  return [...new Set(custom)].toSorted((a, b) => a.localeCompare(b));
}

/** Trim free-text category input, falling back to uncategorized when empty. */
export function normalizeCategoryInput(text: string): string {
  return text.trim() || UNCATEGORIZED;
}
