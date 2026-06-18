import { describe, expect, it } from 'vitest';
import { sortPasswords } from '../sort-passwords';

const rows = [
  { title: 'Github', created_at: '2026-01-01 10:00:00', updated_at: '2026-06-01 10:00:00' },
  { title: 'apple', created_at: '2026-03-01 10:00:00', updated_at: '2026-02-01 10:00:00' },
  { title: 'Expo', created_at: '2026-02-01 10:00:00', updated_at: '2026-06-10 10:00:00' },
];

const titles = (list: { title: string }[]) => list.map(r => r.title);

describe('sortPasswords', () => {
  it('sorts by name A→Z (case-insensitive)', () => {
    expect(titles(sortPasswords(rows, 'name'))).toEqual([
      'apple',
      'Expo',
      'Github',
    ]);
  });

  it('sorts by most recently created', () => {
    expect(titles(sortPasswords(rows, 'created'))).toEqual([
      'apple', // 2026-03
      'Expo', // 2026-02
      'Github', // 2026-01
    ]);
  });

  it('sorts by most recently updated', () => {
    expect(titles(sortPasswords(rows, 'updated'))).toEqual([
      'Expo', // 06-10
      'Github', // 06-01
      'apple', // 02-01
    ]);
  });

  it('does not mutate the input array', () => {
    const original = [...rows];
    sortPasswords(rows, 'name');
    expect(rows).toEqual(original);
  });

  it('returns a new array', () => {
    expect(sortPasswords(rows, 'updated')).not.toBe(rows);
  });
});
