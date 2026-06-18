import { describe, expect, it, vi } from 'vitest';
import { lookupHash } from '../lookup';

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const PASSWORD_SHA1 = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8';
const PASSWORD_SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';

/** Builds a fake fetch returning the given body text with status 200. */
function okFetch(body: string): typeof fetch {
  return vi.fn(async () =>
    new Response(body, { status: 200 })
  ) as unknown as typeof fetch;
}

const RANGE_BODY = [
  '003D68EB55068C33ACE09247EE4C639306B:3',
  `${PASSWORD_SUFFIX}:9659365`,
].join('\r\n');

describe('lookupHash', () => {
  it('returns the breach count for a known-breached hash', async () => {
    const cache = new Map<string, string>();
    const result = await lookupHash(PASSWORD_SHA1, cache, okFetch(RANGE_BODY));
    expect(result).toEqual({ count: 9659365, failed: false });
  });

  it('returns 0 (not failed) when the suffix is absent', async () => {
    const cache = new Map<string, string>();
    const body = '003D68EB55068C33ACE09247EE4C639306B:3';
    const result = await lookupHash(PASSWORD_SHA1, cache, okFetch(body));
    expect(result).toEqual({ count: 0, failed: false });
  });

  it('sends ONLY the 5-char prefix to the network (k-anonymity)', async () => {
    const cache = new Map<string, string>();
    const fetchSpy = vi.fn(async () =>
      new Response(RANGE_BODY, { status: 200 })
    ) as unknown as typeof fetch;
    await lookupHash(PASSWORD_SHA1, cache, fetchSpy);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchSpy as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toBe('https://api.pwnedpasswords.com/range/5BAA6');
    // The full hash and full suffix must never appear in the request URL.
    expect(calledUrl).not.toContain(PASSWORD_SUFFIX);
    expect(calledUrl).not.toContain(PASSWORD_SHA1);
  });

  it('caches by prefix and does not refetch a shared prefix', async () => {
    const cache = new Map<string, string>();
    const fetchSpy = vi.fn(async () =>
      new Response(RANGE_BODY, { status: 200 })
    ) as unknown as typeof fetch;

    await lookupHash(PASSWORD_SHA1, cache, fetchSpy);
    // Same prefix (5BAA6), different suffix — served from cache.
    const other = `5BAA6${'0'.repeat(35)}`;
    const result = await lookupHash(other, cache, fetchSpy);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ count: 0, failed: false });
  });

  it('degrades gracefully on a network error (failed, not safe)', async () => {
    const cache = new Map<string, string>();
    const throwing = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const result = await lookupHash(PASSWORD_SHA1, cache, throwing);
    expect(result).toEqual({ count: 0, failed: true });
  });

  it('degrades gracefully on a non-200 response', async () => {
    const cache = new Map<string, string>();
    const serverError = vi.fn(async () =>
      new Response('nope', { status: 503 })
    ) as unknown as typeof fetch;
    const result = await lookupHash(PASSWORD_SHA1, cache, serverError);
    expect(result).toEqual({ count: 0, failed: true });
  });

  it('reports a malformed hash as failed without fetching', async () => {
    const cache = new Map<string, string>();
    const fetchSpy = vi.fn() as unknown as typeof fetch;
    const result = await lookupHash('not-a-hash', cache, fetchSpy);
    expect(result).toEqual({ count: 0, failed: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
