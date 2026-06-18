/**
 * Cryptographically secure password generation.
 *
 * The previous generator used `Math.random()`, whose output is predictable and
 * therefore unsuitable for password material. This module draws from a CSPRNG
 * and uses rejection sampling to avoid modulo bias.
 *
 * The core logic is pure: it receives a `RandomBytesProvider` so it can be unit
 * tested in Node without native modules. The app injects an `expo-crypto`-backed
 * provider (see `store/vaultKey.ts` → `getMobileRandomBytes`).
 */

/** Mirrors `@repo/db`'s provider shape: returns N random bytes, sync or async. */
export type RandomBytesProvider = (
  length: number
) => Uint8Array | Promise<Uint8Array>;

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  /** Drop visually ambiguous characters (`i l 1 I | o O 0` …) from every pool. */
  excludeSimilar?: boolean;
}

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBERS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Look-alike characters removed by the "exclude similar" option. Covers the
 * usual confusable set: lowercase L / uppercase i / one, uppercase O / zero,
 * and the pipe (easily mistaken for `l`/`I`).
 */
export const SIMILAR_CHARS = 'il1ILoO0|';

/** Strip every character in `SIMILAR_CHARS` from a pool string. */
export function stripSimilar(pool: string): string {
  const banned = new Set(SIMILAR_CHARS);
  let out = '';
  for (const ch of pool) {
    if (!banned.has(ch)) out = out + ch;
  }
  return out;
}

/** A source of uniform integers in `[0, range)` (async). */
export type RandomIndexProvider = (range: number) => Promise<number>;

/**
 * Pulls bytes from the provider one at a time, refilling from a batch buffer so
 * the (async) provider is hit far less often than once per byte.
 */
function createByteStream(randomBytes: RandomBytesProvider, batchSize = 64) {
  let buffer = new Uint8Array(0);
  let position = 0;

  return async function nextByte(): Promise<number> {
    if (position >= buffer.length) {
      buffer = Uint8Array.from(await Promise.resolve(randomBytes(batchSize)));
      position = 0;
      if (buffer.length === 0) {
        throw new Error('RandomBytesProvider returned no bytes');
      }
    }
    return buffer[position++];
  };
}

/**
 * Uniformly distributed integer in `[0, range)`.
 *
 * A naive `value % range` over-weights small remainders whenever `range` does
 * not divide the value space. We draw enough whole bytes to cover `range`, then
 * reject any draw at or above the largest multiple of `range` that fits, which
 * eliminates that bias. Multi-byte draws keep the shuffle correct even for
 * lengths above 256.
 */
async function randomIndex(
  nextByte: () => Promise<number>,
  range: number
): Promise<number> {
  if (range <= 0) {
    throw new Error(`range must be > 0, got ${range}`);
  }
  if (range === 1) {
    return 0;
  }
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const space = 256 ** bytesNeeded;
  const limit = Math.floor(space / range) * range;

  for (;;) {
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = value * 256 + (await nextByte());
    }
    if (value < limit) {
      return value % range;
    }
  }
}

/**
 * Build an unbiased `RandomIndexProvider` backed by a CSPRNG byte stream.
 *
 * Exposed so other generators (e.g. Passphrase word selection) can reuse the
 * exact rejection-sampling logic instead of duplicating it — and never fall
 * back to `Math.random()`.
 */
export function createRandomIndex(
  randomBytes: RandomBytesProvider
): RandomIndexProvider {
  const nextByte = createByteStream(randomBytes);
  return (range: number) => randomIndex(nextByte, range);
}

/**
 * Generate a password using a CSPRNG.
 *
 * Guarantees at least one character from every selected class (when the length
 * permits), then fills the remainder from the combined pool and shuffles via
 * Fisher–Yates so the guaranteed characters are not pinned to fixed positions.
 *
 * Returns `''` when no character class is selected.
 */
export async function generateSecurePassword(
  options: PasswordGeneratorOptions,
  randomBytes: RandomBytesProvider
): Promise<string> {
  const apply = options.excludeSimilar
    ? stripSimilar
    : (pool: string) => pool;
  const pools: string[] = [];
  if (options.includeUppercase) pools.push(apply(UPPERCASE));
  if (options.includeLowercase) pools.push(apply(LOWERCASE));
  if (options.includeNumbers) pools.push(apply(NUMBERS));
  if (options.includeSymbols) pools.push(apply(SYMBOLS));

  // Excluding similars can empty a pool (e.g. symbols never lose all members,
  // but numbers drop "1"/"0"); drop any now-empty class so we never index into
  // an empty string.
  const nonEmpty = pools.filter(pool => pool.length > 0);
  if (nonEmpty.length === 0) return '';

  const length = Math.max(1, Math.floor(options.length));
  const combined = nonEmpty.join('');
  const nextByte = createByteStream(randomBytes);
  const chars: string[] = [];

  // One guaranteed character from each selected class (length permitting).
  for (const pool of nonEmpty) {
    if (chars.length >= length) break;
    chars.push(pool[await randomIndex(nextByte, pool.length)]);
  }

  // Fill the rest from the combined pool.
  while (chars.length < length) {
    chars.push(combined[await randomIndex(nextByte, combined.length)]);
  }

  // Fisher–Yates shuffle so guaranteed characters land at random positions.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = await randomIndex(nextByte, i + 1);
    const tmp = chars[i];
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }

  return chars.join('');
}

/** Where to upper-case in a passphrase. */
export type PassphraseCapitalization = 'none' | 'first' | 'all';

export interface PassphraseOptions {
  /** Number of words to draw from the list. */
  wordCount: number;
  /** Joiner placed between words (e.g. `-`, `.`, space). */
  separator: string;
  /** Capitalization scheme applied to each word. */
  capitalization: PassphraseCapitalization;
}

function capitalizeWord(
  word: string,
  mode: PassphraseCapitalization
): string {
  if (word.length === 0) return word;
  if (mode === 'all') return word.toUpperCase();
  if (mode === 'first') {
    return word[0].toUpperCase() + word.slice(1);
  }
  return word;
}

/**
 * Assemble a passphrase from `wordlist` using an injected, unbiased index
 * provider. Kept pure (no native modules) so it is deterministic in tests: pass
 * a fake `randomIndex`. Word selection is **with replacement** — each draw is an
 * independent uniform pick, which keeps the entropy estimate exact.
 *
 * Returns `''` for an empty wordlist or a non-positive word count.
 */
export async function generatePassphrase(
  options: PassphraseOptions,
  wordlist: readonly string[],
  randomIndexProvider: RandomIndexProvider
): Promise<string> {
  const count = Math.max(0, Math.floor(options.wordCount));
  if (count === 0 || wordlist.length === 0) return '';

  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = await randomIndexProvider(wordlist.length);
    words.push(capitalizeWord(wordlist[index], options.capitalization));
  }
  return words.join(options.separator);
}

/**
 * Shannon entropy (bits) of a random-character password: `length · log2(pool)`.
 * `poolSize` is the number of distinct characters the value was drawn from.
 */
export function passwordEntropyBits(
  length: number,
  poolSize: number
): number {
  if (length <= 0 || poolSize <= 1) return 0;
  return length * Math.log2(poolSize);
}

/**
 * Entropy (bits) of a passphrase whose words are each an independent uniform
 * draw from a list of `wordlistSize` words: `wordCount · log2(wordlistSize)`.
 * Capitalization/separator are deterministic, so they add no entropy.
 */
export function passphraseEntropyBits(
  wordCount: number,
  wordlistSize: number
): number {
  if (wordCount <= 0 || wordlistSize <= 1) return 0;
  return wordCount * Math.log2(wordlistSize);
}

/** Coarse strength bucket from an entropy estimate, for the UI bar. */
export type StrengthLevel = 'weak' | 'medium' | 'strong';

export function strengthFromEntropy(bits: number): StrengthLevel {
  if (bits < 60) return 'weak';
  if (bits < 100) return 'medium';
  return 'strong';
}

/**
 * Size of the effective character pool for a set of class toggles, honoring
 * `excludeSimilar`. Used to estimate entropy for the on-screen strength bar.
 */
export function poolSizeFor(options: {
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar?: boolean;
}): number {
  const apply = options.excludeSimilar
    ? stripSimilar
    : (pool: string) => pool;
  let size = 0;
  if (options.includeUppercase) size = size + apply(UPPERCASE).length;
  if (options.includeLowercase) size = size + apply(LOWERCASE).length;
  if (options.includeNumbers) size = size + apply(NUMBERS).length;
  if (options.includeSymbols) size = size + apply(SYMBOLS).length;
  return size;
}
