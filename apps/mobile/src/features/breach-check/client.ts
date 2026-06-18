// Hashing wrapper for the breach lookup. This is the ONLY module in the feature
// that imports expo-crypto, so the pure parsing/lookup logic stays testable
// without native modules. The actual network call lives in `lookup.ts`.

import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
} from 'expo-crypto';
import { HIBP_PREFIX_LENGTH } from './hibp';
import { type BreachLookup, lookupHash } from './lookup';

export type { BreachLookup };

const SAFE: BreachLookup = { count: 0, failed: false };

/** Computes the uppercase SHA-1 hex digest of a string via expo-crypto. */
export async function sha1Hex(value: string): Promise<string> {
  const digest = await digestStringAsync(CryptoDigestAlgorithm.SHA1, value, {
    encoding: CryptoEncoding.HEX,
  });
  return digest.toUpperCase();
}

/**
 * Looks up a plaintext password: hashes it on-device, then queries the range
 * API by 5-char prefix (only the prefix is ever sent). Empty passwords are
 * reported as clean without any network call.
 */
export async function lookupPassword(
  password: string,
  cache: Map<string, string>,
  fetchImpl: typeof fetch = fetch
): Promise<BreachLookup> {
  if (!password) return SAFE;
  let hash: string;
  try {
    hash = await sha1Hex(password);
  } catch {
    return { count: 0, failed: true };
  }
  // Defensive: confirm we have a usable digest before slicing the prefix.
  if (hash.length < HIBP_PREFIX_LENGTH) return { count: 0, failed: true };
  return lookupHash(hash, cache, fetchImpl);
}
