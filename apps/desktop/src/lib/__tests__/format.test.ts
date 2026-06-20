import { describe, expect, it } from 'vitest';
import { formatBytes } from '../format';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1024 ** 2, '1.0 MB'],
    [1024 ** 3, '1.0 GB'],
  ])('formats %s bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  it('returns a stable fallback for an unknown size', () => {
    expect(formatBytes()).toBe('Unknown size');
  });
});
