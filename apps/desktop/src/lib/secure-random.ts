/**
 * Cryptographically secure password generation (desktop / renderer).
 *
 * The previous generator used `Math.random()`, whose output is predictable and
 * therefore unsuitable for password material. This module draws from WebCrypto
 * (`crypto.getRandomValues`) and uses rejection sampling to avoid modulo bias.
 *
 * The core logic is pure: it receives a `RandomBytesProvider` so it can be unit
 * tested deterministically. The default provider is the renderer's WebCrypto.
 *
 * Mirrors `apps/mobile/src/lib/secure-random.ts`, but synchronous — the renderer
 * has synchronous CSPRNG access, so the generator stays sync (it runs on mount).
 */

/** Returns N random bytes synchronously. */
export type RandomBytesProvider = (length: number) => Uint8Array;

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBERS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/** Characters that are easy to confuse visually (matches the desktop UI option). */
const SIMILAR = /[il1o0]/gi;

export const defaultRandomBytes: RandomBytesProvider = length => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

/**
 * Pulls bytes from the provider one at a time, refilling from a batch buffer so
 * the provider is hit far less often than once per byte.
 */
function createByteStream(randomBytes: RandomBytesProvider, batchSize = 64) {
  let buffer = new Uint8Array(0);
  let position = 0;

  return function nextByte(): number {
    if (position >= buffer.length) {
      buffer = Uint8Array.from(randomBytes(batchSize));
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
function randomIndex(nextByte: () => number, range: number): number {
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
      value = value * 256 + nextByte();
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
 * Returns `''` when no character class is selected (or every selected class is
 * emptied by `excludeSimilar`).
 */
export function generateSecurePassword(
  options: PasswordGeneratorOptions,
  randomBytes: RandomBytesProvider = defaultRandomBytes
): string {
  const filter = (pool: string) => {
    return options.excludeSimilar ? pool.replaceAll(SIMILAR, '') : pool;
  };

  const pools: string[] = [];
  if (options.includeUppercase) {
    pools.push(filter(UPPERCASE));
  }
  if (options.includeLowercase) {
    pools.push(filter(LOWERCASE));
  }
  if (options.includeNumbers) {
    pools.push(filter(NUMBERS));
  }
  if (options.includeSymbols) {
    pools.push(filter(SYMBOLS));
  }

  const usablePools = pools.filter(pool => pool.length > 0);
  if (usablePools.length === 0) {
    return '';
  }

  const length = Math.max(1, Math.floor(options.length));
  const combined = usablePools.join('');
  const nextByte = createByteStream(randomBytes);
  const chars: string[] = [];

  // One guaranteed character from each selected class (length permitting).
  for (const pool of usablePools) {
    if (chars.length >= length) {
      break;
    }
    chars.push(pool[randomIndex(nextByte, pool.length)]);
  }

  // Fill the rest from the combined pool.
  while (chars.length < length) {
    chars.push(combined[randomIndex(nextByte, combined.length)]);
  }

  // Fisher–Yates shuffle so guaranteed characters land at random positions.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(nextByte, i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
}
