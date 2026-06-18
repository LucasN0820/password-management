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
}

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBERS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

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
  const pools: string[] = [];
  if (options.includeUppercase) pools.push(UPPERCASE);
  if (options.includeLowercase) pools.push(LOWERCASE);
  if (options.includeNumbers) pools.push(NUMBERS);
  if (options.includeSymbols) pools.push(SYMBOLS);

  if (pools.length === 0) return '';

  const length = Math.max(1, Math.floor(options.length));
  const combined = pools.join('');
  const nextByte = createByteStream(randomBytes);
  const chars: string[] = [];

  // One guaranteed character from each selected class (length permitting).
  for (const pool of pools) {
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
