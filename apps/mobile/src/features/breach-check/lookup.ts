// Pure network-lookup logic for a single SHA-1 hash, kept free of expo-crypto
// so it can be unit-tested with an injected fetch and no native imports. The
// hashing wrapper that does touch expo-crypto lives in `client.ts`.

import { countFromRangeResponse, rangeUrl, splitHash } from './hibp';

/** Outcome of a single password breach lookup. */
export interface BreachLookup {
  /** Number of times the password appears in known breaches (0 = clean). */
  count: number;
  /**
   * The lookup could not be completed (offline / server error). The `count` is
   * 0 in this case and the caller should treat the entry as "unknown", not
   * "safe".
   */
  failed: boolean;
}

/**
 * Fetches the breach count for a single SHA-1 hash. Caches range responses by
 * prefix (in the provided map) so repeated suffixes that share a prefix — and
 * repeated passwords — never re-hit the network.
 *
 * Never throws: network/parse failures resolve to `{ count: 0, failed: true }`.
 */
export async function lookupHash(
  sha1: string,
  cache: Map<string, string>,
  fetchImpl: typeof fetch = fetch
): Promise<BreachLookup> {
  let prefix: string;
  let suffix: string;
  try {
    ({ prefix, suffix } = splitHash(sha1));
  } catch {
    return { count: 0, failed: true };
  }

  const cached = cache.get(prefix);
  if (cached !== undefined) {
    return { count: countFromRangeResponse(cached, suffix), failed: false };
  }

  try {
    // `Add-Padding` asks HIBP to pad the response so its size can't hint at how
    // many suffixes share our prefix — a small extra privacy win.
    const response = await fetchImpl(rangeUrl(prefix), {
      headers: { 'Add-Padding': 'true' },
    });
    if (!response.ok) {
      return { count: 0, failed: true };
    }
    const body = await response.text();
    cache.set(prefix, body);
    return { count: countFromRangeResponse(body, suffix), failed: false };
  } catch {
    return { count: 0, failed: true };
  }
}
