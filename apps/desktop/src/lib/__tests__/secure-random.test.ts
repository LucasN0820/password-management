/* eslint-disable @typescript-eslint/no-misused-spread -- Password alphabets and outputs are intentionally ASCII-only. */
import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  generateSecurePassword,
  LOWERCASE,
  NUMBERS,
  type PasswordGeneratorOptions,
  type RandomBytesProvider,
  SYMBOLS,
  UPPERCASE,
} from '../secure-random';

const cryptoProvider: RandomBytesProvider = length => {
  return new Uint8Array(nodeRandomBytes(length));
};

/** Cycles through a fixed byte sequence — used to exercise rejection sampling. */
function providerFromBytes(bytes: number[]): RandomBytesProvider {
  let cursor = 0;
  return (length: number) => {
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      out[i] = bytes[cursor++ % bytes.length]!;
    }
    return out;
  };
}

const allClasses: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
};

describe('generateSecurePassword (desktop)', () => {
  it('uses the default WebCrypto provider when none is injected', () => {
    const pw = generateSecurePassword(allClasses);
    expect(pw).toHaveLength(16);
  });

  it('returns an empty string when no character class is selected', () => {
    const pw = generateSecurePassword(
      {
        length: 16,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
      },
      cryptoProvider
    );
    expect(pw).toBe('');
  });

  it('honors the requested length', () => {
    for (const length of [1, 4, 8, 16, 32, 64]) {
      const pw = generateSecurePassword(
        { ...allClasses, length },
        cryptoProvider
      );
      expect(pw).toHaveLength(length);
    }
  });

  it('only emits characters from the selected classes', () => {
    const pw = generateSecurePassword(
      {
        length: 200,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
      },
      cryptoProvider
    );
    const allowed = new Set([
      ...UPPERCASE,
      ...NUMBERS,
    ]);
    for (const ch of pw) {
      expect(allowed.has(ch)).toBe(true);
    }
  });

  it('excludes look-alike characters when excludeSimilar is set', () => {
    const pw = generateSecurePassword(
      { ...allClasses, length: 300, excludeSimilar: true },
      cryptoProvider
    );
    // i, l, 1, o, 0 (case-insensitive) must never appear.
    expect(/[il1o0]/i.test(pw)).toBe(false);
  });

  it('guarantees at least one character from every selected class', () => {
    for (let i = 0; i < 200; i++) {
      const pw = generateSecurePassword(allClasses, cryptoProvider);
      expect([...pw].some(ch => UPPERCASE.includes(ch))).toBe(true);
      expect([...pw].some(ch => LOWERCASE.includes(ch))).toBe(true);
      expect([...pw].some(ch => NUMBERS.includes(ch))).toBe(true);
      expect([...pw].some(ch => SYMBOLS.includes(ch))).toBe(true);
    }
  });

  it('rejects biased bytes instead of taking them mod range', () => {
    // Numbers-only, length 1 → one draw over range 10 (limit = 250).
    // 252 is >= 250 and must be rejected; the next byte (7) yields '7'.
    // A naive `252 % 10` would have produced '2'.
    const pw = generateSecurePassword(
      {
        length: 1,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false,
      },
      providerFromBytes([252, 7])
    );
    expect(pw).toBe('7');
  });

  it('produces an approximately uniform distribution (no modulo bias)', () => {
    const counts = new Map<string, number>();
    const samples = 2000;
    const length = 32;
    for (let i = 0; i < samples; i++) {
      const pw = generateSecurePassword(
        {
          length,
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: true,
          includeSymbols: false,
          excludeSimilar: false,
        },
        cryptoProvider
      );
      for (const ch of pw) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }

    expect(counts.size).toBe(NUMBERS.length);

    const total = samples * length;
    const expected = total / NUMBERS.length;
    for (const ch of NUMBERS) {
      const observed = counts.get(ch) ?? 0;
      expect(observed).toBeGreaterThan(expected * 0.85);
      expect(observed).toBeLessThan(expected * 1.15);
    }
  });
});
