import { describe, expect, it } from 'vitest';
import {
  countFromRangeResponse,
  HIBP_PREFIX_LENGTH,
  rangeUrl,
  splitHash,
} from '../hibp';

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const PASSWORD_SHA1 = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8';

describe('splitHash', () => {
  it('splits a SHA-1 digest into a 5-char prefix and 35-char suffix', () => {
    const { prefix, suffix } = splitHash(PASSWORD_SHA1);
    expect(prefix).toBe('5BAA6');
    expect(prefix).toHaveLength(HIBP_PREFIX_LENGTH);
    expect(suffix).toBe('1E4C9B93F3F0682250B6CF8331B7EE68FD8');
    expect(suffix).toHaveLength(35);
  });

  it('uppercases and trims lowercase / padded input', () => {
    const { prefix, suffix } = splitHash(`  ${PASSWORD_SHA1.toLowerCase()}  `);
    expect(prefix).toBe('5BAA6');
    expect(suffix).toBe('1E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('rejects non-hex / wrong-length input', () => {
    expect(() => splitHash('xyz')).toThrow();
    expect(() => splitHash('5BAA6')).toThrow();
    expect(() => splitHash(`${PASSWORD_SHA1}AA`)).toThrow();
  });
});

describe('rangeUrl', () => {
  it('builds the HIBP range URL from an (uppercased) prefix', () => {
    expect(rangeUrl('5baa6')).toBe(
      'https://api.pwnedpasswords.com/range/5BAA6'
    );
  });
});

describe('countFromRangeResponse', () => {
  // Real-shaped slice of a range response (suffix:count lines, CRLF).
  const body = [
    '003D68EB55068C33ACE09247EE4C639306B:3',
    '1E4C9B93F3F0682250B6CF8331B7EE68FD8:9659365',
    '011053FD0102E94D6AE2F8B83D76FAF94F6:1',
  ].join('\r\n');

  it('returns the count for a matching suffix (case-insensitive)', () => {
    expect(
      countFromRangeResponse(body, '1E4C9B93F3F0682250B6CF8331B7EE68FD8')
    ).toBe(9659365);
    expect(
      countFromRangeResponse(body, '1e4c9b93f3f0682250b6cf8331b7ee68fd8')
    ).toBe(9659365);
  });

  it('returns 0 when the suffix is absent (strong/random password)', () => {
    expect(
      countFromRangeResponse(body, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
    ).toBe(0);
  });

  it('tolerates blank lines and trailing whitespace', () => {
    const padded = `\n  ${body}  \n\n`;
    expect(
      countFromRangeResponse(padded, '003D68EB55068C33ACE09247EE4C639306B')
    ).toBe(3);
  });

  it('returns 0 for a malformed count', () => {
    expect(countFromRangeResponse('ABC:notanumber', 'ABC')).toBe(0);
  });
});
