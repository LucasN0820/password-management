import { describe, expect, it } from 'vitest';
import { base32Decode, generateTotp, hotp, isValidBase32Secret } from '../totp';

/**
 * The RFC 6238 Appendix B reference secret is the ASCII string
 * "12345678901234567890" (20 bytes), which encodes to the Base32 value below.
 */
const RFC6238_SHA1_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('base32Decode', () => {
  it('decodes the RFC 6238 reference secret to the ASCII seed', () => {
    const bytes = base32Decode(RFC6238_SHA1_SECRET);
    expect(new TextDecoder().decode(bytes)).toBe('12345678901234567890');
  });

  it('ignores whitespace, padding and case', () => {
    const a = base32Decode('JBSWY3DP');
    const b = base32Decode('jbsw y3dp==');
    expect([...a]).toEqual([...b]);
    // "JBSWY3DP" is the Base32 of the ASCII string "Hello".
    expect(new TextDecoder().decode(a)).toBe('Hello');
  });

  it('rejects invalid characters', () => {
    expect(() => base32Decode('0189')).toThrow();
  });
});

describe('isValidBase32Secret', () => {
  it('accepts grouped/lowercase secrets', () => {
    expect(isValidBase32Secret('jbsw y3dp ehpk 3pxp')).toBe(true);
  });

  it('rejects empty and non-Base32 input', () => {
    expect(isValidBase32Secret('')).toBe(false);
    expect(isValidBase32Secret('   ')).toBe(false);
    expect(isValidBase32Secret('not-base32!')).toBe(false);
  });
});

describe('hotp (RFC 4226 Appendix D test vectors)', () => {
  // Secret "12345678901234567890" → Base32 reference seed.
  const secret = base32Decode(RFC6238_SHA1_SECRET);
  const expected = [
    '755224',
    '287082',
    '359152',
    '969429',
    '338314',
    '254676',
    '287922',
    '162583',
    '399871',
    '520489',
  ];

  expected.forEach((code, counter) => {
    it(`counter ${counter} → ${code}`, () => {
      expect(hotp(secret, counter, 6)).toBe(code);
    });
  });
});

describe('generateTotp (RFC 6238 Appendix B SHA-1 vectors)', () => {
  // The published vectors are 8 digits with a 30s step, SHA-1 variant.
  const vectors: { time: number; code: string }[] = [
    { time: 59, code: '94287082' },
    { time: 1111111109, code: '07081804' },
    { time: 1111111111, code: '14050471' },
    { time: 1234567890, code: '89005924' },
    { time: 2000000000, code: '69279037' },
    { time: 20000000000, code: '65353130' },
  ];

  vectors.forEach(({ time, code }) => {
    it(`unix ${time}s → ${code}`, () => {
      const result = generateTotp(RFC6238_SHA1_SECRET, time * 1000, {
        digits: 8,
      });
      expect(result.code).toBe(code);
    });
  });

  it('defaults to 6 digits and a 30s period', () => {
    const result = generateTotp(RFC6238_SHA1_SECRET, 59 * 1000);
    expect(result.code).toBe('94287082'.slice(-6));
    expect(result.period).toBe(30);
  });

  it('reports correct seconds remaining at period boundaries', () => {
    // t=0 → full window remaining.
    expect(generateTotp(RFC6238_SHA1_SECRET, 0).secondsRemaining).toBe(30);
    // t=1s into the step → 29 remaining.
    expect(generateTotp(RFC6238_SHA1_SECRET, 1000).secondsRemaining).toBe(29);
    // t=29s → 1 remaining.
    expect(generateTotp(RFC6238_SHA1_SECRET, 29_000).secondsRemaining).toBe(1);
    // t=30s → new window, 30 remaining.
    expect(generateTotp(RFC6238_SHA1_SECRET, 30_000).secondsRemaining).toBe(30);
  });
});
