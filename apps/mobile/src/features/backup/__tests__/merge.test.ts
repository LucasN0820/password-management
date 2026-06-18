import { describe, expect, it } from 'vitest';
import { fingerprintOf, mergeEntries } from '../merge';
import type { BackupEntry } from '../types';

function entry(overrides: Partial<BackupEntry> = {}): BackupEntry {
  return {
    title: 'GitHub',
    username: 'octocat',
    password: 'pw',
    url: 'https://github.com',
    notes: null,
    category: 'all',
    isFavorite: false,
    icon: null,
    ...overrides,
  };
}

describe('fingerprintOf', () => {
  it('is case- and whitespace-insensitive on title/username/url', () => {
    expect(
      fingerprintOf({ title: ' GitHub ', username: 'OctoCat', url: 'X' })
    ).toBe(fingerprintOf({ title: 'github', username: 'octocat', url: ' x ' }));
  });

  it('treats null url as empty', () => {
    expect(fingerprintOf({ title: 'a', username: 'b', url: null })).toBe(
      fingerprintOf({ title: 'a', username: 'b', url: '' })
    );
  });
});

describe('mergeEntries', () => {
  it('skips entries already present in the vault', () => {
    const result = mergeEntries(
      [entry()],
      [{ title: 'github', username: 'octocat', url: 'https://github.com' }]
    );
    expect(result.toAdd).toHaveLength(0);
    expect(result.skipped).toBe(1);
  });

  it('adds new entries and preserves their fields', () => {
    const result = mergeEntries(
      [entry({ title: 'New', url: null, isFavorite: true, category: 'work' })],
      []
    );
    expect(result.toAdd).toHaveLength(1);
    expect(result.toAdd[0]).toMatchObject({
      title: 'New',
      url: null,
      isFavorite: true,
      category: 'work',
    });
  });

  it('de-dupes duplicates within the same import (first wins)', () => {
    const result = mergeEntries([entry(), entry({ password: 'other' })], []);
    expect(result.toAdd).toHaveLength(1);
    expect(result.skipped).toBe(1);
    expect(result.toAdd[0]?.password).toBe('pw');
  });

  it('defaults a blank category to all', () => {
    const result = mergeEntries([entry({ category: '' })], []);
    expect(result.toAdd[0]?.category).toBe('all');
  });
});
