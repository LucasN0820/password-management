import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  generateSecurePassword,
  LOWERCASE,
  NUMBERS,
  SYMBOLS,
  UPPERCASE,
  type PasswordGeneratorOptions,
  type RandomBytesProvider,
} from '../secure-random';

const cryptoProvider: RandomBytesProvider = length =>
  new Uint8Array(nodeRandomBytes(length));

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
};

describe('generateSecurePassword', () => {
  it('returns an empty string when no character class is selected', async () => {
    const pw = await generateSecurePassword(
      {
        length: 16,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      },
      cryptoProvider
    );
    expect(pw).toBe('');
  });

  it('honors the requested length', async () => {
    for (const length of [1, 4, 8, 16, 32, 64]) {
      const pw = await generateSecurePassword(
        { ...allClasses, length },
        cryptoProvider
      );
      expect(pw).toHaveLength(length);
    }
  });

  it('only emits characters from the selected classes', async () => {
    const pw = await generateSecurePassword(
      {
        length: 200,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
      },
      cryptoProvider
    );
    const allowed = new Set([...UPPERCASE, ...NUMBERS]);
    for (const ch of pw) {
      expect(allowed.has(ch)).toBe(true);
    }
  });

  it('guarantees at least one character from every selected class', async () => {
    // Run repeatedly: a correct implementation never misses a class.
    for (let i = 0; i < 200; i++) {
      const pw = await generateSecurePassword(allClasses, cryptoProvider);
      expect([...pw].some(ch => UPPERCASE.includes(ch))).toBe(true);
      expect([...pw].some(ch => LOWERCASE.includes(ch))).toBe(true);
      expect([...pw].some(ch => NUMBERS.includes(ch))).toBe(true);
      expect([...pw].some(ch => SYMBOLS.includes(ch))).toBe(true);
    }
  });

  it('rejects biased bytes (>= floor(256/range)*range) instead of taking them mod range', async () => {
    // Numbers-only, length 1 → exactly one draw over a range of 10 (limit = 250).
    // Byte 255 must be rejected; the next byte (5) yields index 5 → '5'.
    // A naive `255 % 10` would have produced '5' too, so use 252 → naive gives
    // index 2 ('2'); rejection sampling must skip it and use the next byte.
    const options: PasswordGeneratorOptions = {
      length: 1,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    };
    const pw = await generateSecurePassword(
      options,
      providerFromBytes([252, 7])
    );
    expect(pw).toBe('7');
  });

  it('produces an approximately uniform distribution (no modulo bias)', async () => {
    const counts = new Map<string, number>();
    const samples = 2000;
    const length = 32;
    for (let i = 0; i < samples; i++) {
      const pw = await generateSecurePassword(
        {
          length,
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: true,
          includeSymbols: false,
        },
        cryptoProvider
      );
      for (const ch of pw) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }

    // All 10 digits should appear.
    expect(counts.size).toBe(NUMBERS.length);

    const total = samples * length;
    const expected = total / NUMBERS.length;
    for (const ch of NUMBERS) {
      const observed = counts.get(ch) ?? 0;
      // Generous ±15% band — tight enough to catch a biased generator,
      // loose enough to never flake on a correct one.
      expect(observed).toBeGreaterThan(expected * 0.85);
      expect(observed).toBeLessThan(expected * 1.15);
    }
  });

  it('accepts an async random-bytes provider', async () => {
    const asyncProvider: RandomBytesProvider = length =>
      Promise.resolve(new Uint8Array(nodeRandomBytes(length)));
    const pw = await generateSecurePassword(allClasses, asyncProvider);
    expect(pw).toHaveLength(16);
  });
});
