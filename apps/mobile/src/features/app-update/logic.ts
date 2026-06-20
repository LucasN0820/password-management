export interface MobileRelease {
  version: string;
  downloadUrl: string;
}

interface GitHubAsset {
  name?: unknown;
  browser_download_url?: unknown;
}

interface GitHubRelease {
  tag_name?: unknown;
  draft?: unknown;
  prerelease?: unknown;
  assets?: unknown;
}

const MOBILE_TAG = /^mobile-v(\d+(?:\.\d+){1,2}(?:[-+][0-9A-Za-z.-]+)?)$/;

function numericParts(version: string) {
  return version
    .split(/[+-]/, 1)[0]
    .split('.')
    .map(part => Number.parseInt(part, 10));
}

function segment(parts: number[], index: number) {
  const value = parts[index];
  // `?? 0` alone wouldn't catch NaN from a malformed (non-tag) version string.
  return Number.isFinite(value) ? value : 0;
}

export function compareVersions(left: string, right: string) {
  const leftParts = numericParts(left);
  const rightParts = numericParts(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index = index + 1) {
    const difference = segment(leftParts, index) - segment(rightParts, index);
    if (difference !== 0) return Math.sign(difference);
  }

  return 0;
}

export function latestMobileRelease(input: unknown): MobileRelease | null {
  if (!Array.isArray(input)) return null;

  const releases = input.flatMap(item => {
    if (!item || typeof item !== 'object') return [];

    const release = item as GitHubRelease;
    if (release.draft === true || release.prerelease === true) return [];
    if (typeof release.tag_name !== 'string') return [];

    const match = MOBILE_TAG.exec(release.tag_name);
    if (!match?.[1] || !Array.isArray(release.assets)) return [];

    const apk = release.assets.find(asset => {
      if (!asset || typeof asset !== 'object') return false;
      const candidate = asset as GitHubAsset;
      return (
        typeof candidate.name === 'string' &&
        candidate.name.toLowerCase().endsWith('.apk') &&
        typeof candidate.browser_download_url === 'string'
      );
    }) as GitHubAsset | undefined;

    return apk && typeof apk.browser_download_url === 'string'
      ? [{ version: match[1], downloadUrl: apk.browser_download_url }]
      : [];
  });

  return (
    releases.toSorted((left, right) =>
      compareVersions(right.version, left.version)
    )[0] ?? null
  );
}
