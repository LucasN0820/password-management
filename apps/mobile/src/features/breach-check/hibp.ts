// Pure helpers for the Have I Been Pwned "Pwned Passwords" range API using
// k-anonymity. These functions take/return plain strings so they can be
// unit-tested with no native (expo-crypto) or network imports.
//
// PRIVACY: only the first 5 hex characters of the SHA-1 hash ever leave the
// device. The full hash and the full password are NEVER transmitted.

/** Base URL of the HIBP Pwned Passwords range endpoint. */
export const HIBP_RANGE_BASE_URL = 'https://api.pwnedpasswords.com/range';

/** Number of leading hex characters sent to the server (the k-anonymity prefix). */
export const HIBP_PREFIX_LENGTH = 5;

/**
 * Splits an uppercase SHA-1 hex digest into the 5-char prefix that is sent to
 * the server and the remaining suffix that is matched locally.
 *
 * @throws If the input is not a 40-char hex string.
 */
export function splitHash(sha1Hex: string): { prefix: string; suffix: string } {
  const hash = sha1Hex.trim().toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(hash)) {
    throw new Error('splitHash expects a 40-char hex SHA-1 digest');
  }
  return {
    prefix: hash.slice(0, HIBP_PREFIX_LENGTH),
    suffix: hash.slice(HIBP_PREFIX_LENGTH),
  };
}

/** Builds the request URL for a given 5-char prefix. */
export function rangeUrl(prefix: string): string {
  return `${HIBP_RANGE_BASE_URL}/${prefix.toUpperCase()}`;
}

/**
 * Parses the plain-text body returned by the range API and finds the breach
 * count for our suffix.
 *
 * The body is a list of `SUFFIX:COUNT` lines (suffixes are the remaining 35 hex
 * chars of the SHA-1, uppercase). We match case-insensitively and tolerate
 * CRLF, blank lines and surrounding whitespace. Returns 0 when the suffix is
 * absent or the count is unparseable.
 */
export function countFromRangeResponse(body: string, suffix: string): number {
  const target = suffix.trim().toUpperCase();
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const lineSuffix = line.slice(0, sep).toUpperCase();
    if (lineSuffix !== target) continue;
    const count = Number.parseInt(line.slice(sep + 1).trim(), 10);
    return Number.isNaN(count) ? 0 : count;
  }
  return 0;
}
