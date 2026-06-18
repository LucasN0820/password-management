import { describe, expect, it } from 'vitest';
import {
  type AuditEntry,
  auditVault,
  classifyStrength,
  isWeak,
  ONE_YEAR_MS,
  scorePassword,
} from '../password-strength';

describe('scorePassword', () => {
  it('scores an empty password as 0', () => {
    expect(scorePassword('')).toBe(0);
  });

  it('rewards length tiers and character classes', () => {
    // 8 lowercase letters: no length bonus, lowercase only -> 1.
    expect(scorePassword('abcdefgh')).toBe(1);
    // 12 chars, lower + digit -> length(>=12)=1 + lower=1 + digit=1 = 3.
    expect(scorePassword('abcdefghij12')).toBe(3);
    // 16 chars, all classes -> 2 (length) + 4 (classes) = 6.
    expect(scorePassword('Abcdefghij123!@#')).toBe(6);
  });
});

describe('classifyStrength', () => {
  it('classifies weak / medium / strong by score bands', () => {
    expect(classifyStrength('')).toBe('weak'); // 0
    expect(classifyStrength('abcdefgh')).toBe('weak'); // 1
    expect(classifyStrength('ab')).toBe('weak'); // lowercase only -> 1
    expect(classifyStrength('Ab1')).toBe('medium'); // upper+lower+digit -> 3
    expect(classifyStrength('abcdefghij12')).toBe('medium'); // 3
    expect(classifyStrength('Abcdefghij12')).toBe('medium'); // 4
    expect(classifyStrength('Abcdefghij123!@#')).toBe('strong'); // 6
  });

  it('isWeak agrees with classifyStrength', () => {
    expect(isWeak('123')).toBe(true);
    expect(isWeak('Abcdefghij123!@#')).toBe(false);
  });
});

describe('auditVault', () => {
  const now = Date.UTC(2026, 0, 1);

  function iso(daysAgo: number): string {
    return new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  }

  it('returns empty buckets for an empty vault', () => {
    const result = auditVault<AuditEntry>([], now);
    expect(result.total).toBe(0);
    expect(result.weak).toEqual([]);
    expect(result.reused).toEqual([]);
    expect(result.old).toEqual([]);
  });

  it('flags weak passwords', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: '123', updated_at: iso(1) },
      { id: 2, password: 'Abcdefghij123!@#', updated_at: iso(1) },
    ];
    const { weak } = auditVault(entries, now);
    expect(weak.map(e => e.id)).toEqual([1]);
  });

  it('flags reused plaintext passwords across multiple entries', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: 'Repeated-Pass-99!', updated_at: iso(1) },
      { id: 2, password: 'Repeated-Pass-99!', updated_at: iso(1) },
      { id: 3, password: 'Unique-Pass-12!', updated_at: iso(1) },
    ];
    const { reused } = auditVault(entries, now);
    // auditVault preserves input order, so reused ids come out [1, 2].
    expect(reused.map(e => e.id)).toEqual([1, 2]);
  });

  it('does not treat empty passwords as reused', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: '', updated_at: iso(1) },
      { id: 2, password: '', updated_at: iso(1) },
    ];
    expect(auditVault(entries, now).reused).toEqual([]);
  });

  it('flags entries older than the stale threshold', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: 'Abcdefghij123!@#', updated_at: iso(400) }, // > 1yr
      { id: 2, password: 'Abcdefghij123!@#', updated_at: iso(30) }, // recent
    ];
    const { old } = auditVault(entries, now, ONE_YEAR_MS);
    expect(old.map(e => e.id)).toEqual([1]);
  });

  it('treats unparseable / missing timestamps as not-stale', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: 'Abcdefghij123!@#', updated_at: null },
      { id: 2, password: 'Abcdefghij123!@#', updated_at: 'not-a-date' },
      { id: 3, password: 'Abcdefghij123!@#' },
    ];
    expect(auditVault(entries, now).old).toEqual([]);
  });

  it('parses SQLite CURRENT_TIMESTAMP format (space-separated UTC)', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: 'Abcdefghij123!@#', updated_at: '2024-01-01 00:00:00' },
    ];
    const { old } = auditVault(entries, now, ONE_YEAR_MS);
    expect(old.map(e => e.id)).toEqual([1]);
  });

  it('reports the total entry count', () => {
    const entries: AuditEntry[] = [
      { id: 1, password: 'a', updated_at: iso(1) },
      { id: 2, password: 'b', updated_at: iso(1) },
    ];
    expect(auditVault(entries, now).total).toBe(2);
  });

  it('handles a large vault without nested scans (smoke / perf)', () => {
    const entries: AuditEntry[] = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      password: i % 2 === 0 ? 'shared-weak' : `Strong-Unique-${i}-aB1!`,
      updated_at: iso(i % 500),
    }));
    const result = auditVault(entries, now);
    expect(result.total).toBe(5000);
    // All even-id entries share the same weak password.
    expect(result.weak.length).toBe(2500);
    expect(result.reused.length).toBe(2500);
  });
});
