import { describe, expect, it } from 'vitest';
import { parseCsv, serializeCsv } from '../csv';
import type { BackupEntry } from '../types';

function entry(overrides: Partial<BackupEntry> = {}): BackupEntry {
  return {
    title: 'GitHub',
    username: 'octocat',
    password: 'hunter2',
    url: 'https://github.com',
    notes: null,
    category: 'all',
    isFavorite: false,
    icon: null,
    ...overrides,
  };
}

describe('serializeCsv', () => {
  it('writes a header row and standard columns', () => {
    const csv = serializeCsv([entry()]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('title,username,password,url,notes');
    expect(lines[1]).toBe('GitHub,octocat,hunter2,https://github.com,');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const csv = serializeCsv([
      entry({
        title: 'Acme, Inc',
        notes: 'line1\nline2',
        password: 'a"b',
      }),
    ]);
    const row = csv.split('\r\n')[1] ?? '';
    expect(row).toContain('"Acme, Inc"');
    expect(row).toContain('"line1\nline2"');
    expect(row).toContain('"a""b"');
  });
});

describe('parseCsv', () => {
  it('round-trips through serialize', () => {
    const original = [
      entry(),
      entry({
        title: 'Acme, Inc',
        notes: 'multi\nline "quoted"',
        url: null,
      }),
    ];
    const parsed = parseCsv(serializeCsv(original));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.title).toBe('GitHub');
    expect(parsed[1]?.title).toBe('Acme, Inc');
    expect(parsed[1]?.notes).toBe('multi\nline "quoted"');
    expect(parsed[1]?.url).toBeNull();
  });

  it('honors arbitrary column order and ignores unknown columns', () => {
    const csv = ['password,extra,title,username', 'pw,x,Title,user'].join('\n');
    const parsed = parseCsv(csv);
    expect(parsed[0]).toMatchObject({
      title: 'Title',
      username: 'user',
      password: 'pw',
    });
  });

  it('returns an empty array for blank input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('   \r\n')).toEqual([]);
  });

  it('skips wholly empty rows', () => {
    const csv = 'title,username,password,url,notes\n,,,,\nGitHub,octocat,pw,,';
    const parsed = parseCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.title).toBe('GitHub');
  });
});
