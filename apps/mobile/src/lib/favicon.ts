/**
 * Favicon helpers. Pure URL derivation so it can be unit tested; the actual
 * fetch happens when an `<Image>` renders the returned URL, so callers gate this
 * behind the opt-in `fetchFavicons` setting (it is a network request, and this
 * app is privacy-first — default OFF).
 */

/** Extract a hostname from a possibly scheme-less URL. Returns null if unusable. */
export function hostnameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][\w+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const host = new URL(withScheme).hostname;
    return host || null;
  } catch {
    return null;
  }
}

/**
 * A favicon image URL for the given site URL, or null when no host can be
 * resolved. Uses Google's public favicon service (returns a sensible default
 * icon for unknown hosts).
 */
export function faviconUrl(
  url: string | null | undefined,
  size = 64
): string | null {
  const host = hostnameFromUrl(url);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    host
  )}&sz=${size}`;
}
