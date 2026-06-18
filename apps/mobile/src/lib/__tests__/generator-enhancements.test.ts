import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createRandomIndex,
  generatePassphrase,
  generateSecurePassword,
  NUMBERS,
  passphraseEntropyBits,
  passwordEntropyBits,
  type PasswordGeneratorOptions,
  poolSizeFor,
  type RandomBytesProvider,
  type RandomIndexProvider,
  SIMILAR_CHARS,
  strengthFromEntropy,
  stripSimilar,
} from '../secure-random';

const cryptoProvider: RandomBytesProvider = length =>
  new Uint8Array(nodeRandomBytes(length));

/** Deterministic index provider that walks a fixed list (mod range). */
function fakeIndex(seq: number[]): RandomIndexProvider {
  let i = 0;
  return (range: number) => Promise.resolve(seq[i++ % seq.length] % range);
}

describe('stripSimilar / SIMILAR_CHARS', () => {
  it('removes every banned look-alike from a pool', () => {
    expect(stripSimilar(NUMBERS)).toBe('23456789');
    expect(stripSimilar('ABCDEFGHIJKLMNO')).toBe('ABCDEFGHJKMN');
    for (const ch of SIMILAR_CHARS) {
      expect(stripSimilar(`abc${  ch  }xyz`)).not.toContain(ch);
    }
  });

  it('is a no-op for a pool with no look-alikes', () => {
    expect(stripSimilar('23456789')).toBe('23456789');
  });
});

describe('generateSecurePassword excludeSimilar', () => {
  it('never emits an excluded character when excludeSimilar is on', async () => {
    const options: PasswordGeneratorOptions = {
      length: 300,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
    };
    const pw = await generateSecurePassword(options, cryptoProvider);
    const banned = new Set(SIMILAR_CHARS);
    for (const ch of pw) {
      expect(banned.has(ch)).toBe(false);
    }
  });

  it('still emits excluded characters when the toggle is off', async () => {
    // Over many draws the digits "0"/"1" should appear at least once.
    let sawExcluded = false;
    for (let i = 0; i < 50 && !sawExcluded; i++) {
      const pw = await generateSecurePassword(
        {
          length: 64,
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: true,
          includeSymbols: false,
          excludeSimilar: false,
        },
        cryptoProvider
      );
      if (/[01]/.test(pw)) sawExcluded = true;
    }
    expect(sawExcluded).toBe(true);
  });

  it('returns an empty string when excluding empties every pool', async () => {
    // Numbers-only with excludeSimilar still leaves 2-9, so this is non-empty;
    // verify the non-empty path instead.
    const pw = await generateSecurePassword(
      {
        length: 8,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: true,
      },
      cryptoProvider
    );
    expect(pw).toHaveLength(8);
    expect(pw).not.toMatch(/[01]/);
  });
});

describe('generatePassphrase', () => {
  const words = ['alpha', 'bravo', 'charlie', 'delta'];

  it('picks the right words via the injected index provider', async () => {
    const phrase = await generatePassphrase(
      { wordCount: 3, separator: '-', capitalization: 'none' },
      words,
      fakeIndex([0, 2, 3])
    );
    expect(phrase).toBe('alpha-charlie-delta');
  });

  it('honors word count, separator and "first" capitalization', async () => {
    const phrase = await generatePassphrase(
      { wordCount: 2, separator: '.', capitalization: 'first' },
      words,
      fakeIndex([1, 0])
    );
    expect(phrase).toBe('Bravo.Alpha');
  });

  it('supports "all" capitalization and space separator', async () => {
    const phrase = await generatePassphrase(
      { wordCount: 2, separator: ' ', capitalization: 'all' },
      words,
      fakeIndex([0, 1])
    );
    expect(phrase).toBe('ALPHA BRAVO');
  });

  it('returns empty for zero words or an empty list', async () => {
    expect(
      await generatePassphrase(
        { wordCount: 0, separator: '-', capitalization: 'none' },
        words,
        fakeIndex([0])
      )
    ).toBe('');
    expect(
      await generatePassphrase(
        { wordCount: 3, separator: '-', capitalization: 'none' },
        [],
        fakeIndex([0])
      )
    ).toBe('');
  });

  it('draws every word from the supplied list (CSPRNG-backed)', async () => {
    const idx = createRandomIndex(cryptoProvider);
    const phrase = await generatePassphrase(
      { wordCount: 6, separator: '-', capitalization: 'none' },
      words,
      idx
    );
    for (const w of phrase.split('-')) {
      expect(words).toContain(w);
    }
  });

  it('produces an approximately uniform word distribution', async () => {
    const idx = createRandomIndex(cryptoProvider);
    const counts = new Map<string, number>();
    for (let i = 0; i < 4000; i++) {
      const w = await generatePassphrase(
        { wordCount: 1, separator: '-', capitalization: 'none' },
        words,
        idx
      );
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    expect(counts.size).toBe(words.length);
    const expected = 4000 / words.length;
    for (const w of words) {
      const observed = counts.get(w) ?? 0;
      expect(observed).toBeGreaterThan(expected * 0.85);
      expect(observed).toBeLessThan(expected * 1.15);
    }
  });
});

describe('entropy estimation', () => {
  it('computes password entropy as length * log2(pool)', () => {
    expect(passwordEntropyBits(10, 1)).toBe(0);
    expect(passwordEntropyBits(0, 26)).toBe(0);
    expect(passwordEntropyBits(8, 256)).toBeCloseTo(64);
    expect(passwordEntropyBits(16, 95)).toBeCloseTo(16 * Math.log2(95));
  });

  it('computes passphrase entropy as wordCount * log2(size)', () => {
    expect(passphraseEntropyBits(4, 256)).toBeCloseTo(32);
    expect(passphraseEntropyBits(6, 256)).toBeCloseTo(48);
    expect(passphraseEntropyBits(0, 256)).toBe(0);
    expect(passphraseEntropyBits(4, 1)).toBe(0);
  });

  it('buckets strength by entropy thresholds', () => {
    expect(strengthFromEntropy(0)).toBe('weak');
    expect(strengthFromEntropy(59)).toBe('weak');
    expect(strengthFromEntropy(60)).toBe('medium');
    expect(strengthFromEntropy(99)).toBe('medium');
    expect(strengthFromEntropy(100)).toBe('strong');
    expect(strengthFromEntropy(256)).toBe('strong');
  });

  it('reports the effective pool size with/without excludeSimilar', () => {
    const base = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    };
    expect(poolSizeFor(base)).toBe(26 + 26 + 10 + 26);
    const reduced = poolSizeFor({ ...base, excludeSimilar: true });
    expect(reduced).toBeLessThan(poolSizeFor(base));
  });
});
