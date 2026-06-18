import { describe, expect, it } from 'vitest';
import {
  deriveCategories,
  isCustomCategory,
  normalizeCategoryInput,
  UNCATEGORIZED,
} from '../categories';

describe('isCustomCategory', () => {
  it('treats all / favorites / empty as non-custom', () => {
    expect(isCustomCategory('all')).toBe(false);
    expect(isCustomCategory('favorites')).toBe(false);
    expect(isCustomCategory('')).toBe(false);
    expect(isCustomCategory(null)).toBe(false);
    expect(isCustomCategory(undefined)).toBe(false);
  });

  it('treats any other value as custom', () => {
    expect(isCustomCategory('Bank')).toBe(true);
    expect(isCustomCategory('work')).toBe(true);
  });
});

describe('deriveCategories', () => {
  const rows = (...cats: string[]) => cats.map(category => ({ category }));

  it('returns an empty list when there are no custom categories', () => {
    expect(deriveCategories(rows('all', 'all'))).toEqual([]);
    expect(deriveCategories([])).toEqual([]);
  });

  it('excludes virtual categories and empty values', () => {
    expect(deriveCategories(rows('all', 'favorites', '', 'Bank'))).toEqual([
      'Bank',
    ]);
  });

  it('dedupes and sorts case-insensitively', () => {
    expect(deriveCategories(rows('work', 'Bank', 'work', 'apps'))).toEqual([
      'apps',
      'Bank',
      'work',
    ]);
  });
});

describe('normalizeCategoryInput', () => {
  it('trims and falls back to uncategorized when empty', () => {
    expect(normalizeCategoryInput('  Bank  ')).toBe('Bank');
    expect(normalizeCategoryInput('')).toBe(UNCATEGORIZED);
    expect(normalizeCategoryInput('   ')).toBe(UNCATEGORIZED);
  });

  it('preserves internal spaces', () => {
    expect(normalizeCategoryInput('My Bank')).toBe('My Bank');
  });
});
