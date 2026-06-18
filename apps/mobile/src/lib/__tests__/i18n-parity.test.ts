import { describe, expect, it } from 'vitest';
import { resources } from '@repo/i18n';

/**
 * Recursively collect the dotted key paths of a (possibly nested) JSON object,
 * so that en/zh can be compared for exact structural parity. Leaf values are
 * ignored — only the shape of the key tree matters.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  // Copy then sort to avoid Hermes-missing Array#toSorted.
  // eslint-disable-next-line unicorn/no-array-sort
  return [...keys].sort();
}

describe('i18n locale parity', () => {
  const enKeys = collectKeys(resources.en.translation);
  const zhKeys = collectKeys(resources.zh.translation);

  it('en and zh expose the same set of keys', () => {
    const missingInZh = enKeys.filter(k => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter(k => !enKeys.includes(k));
    expect({ missingInZh, missingInEn }).toEqual({
      missingInZh: [],
      missingInEn: [],
    });
  });

  it('has the same number of keys in both locales', () => {
    expect(enKeys.length).toBe(zhKeys.length);
  });
});
