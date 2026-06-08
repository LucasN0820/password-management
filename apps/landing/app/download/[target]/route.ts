import { NextResponse } from 'next/server';

type DownloadTarget = 'desktop' | 'mobile';

type GitHubAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
};

type GitHubErrorBody = {
  message?: string;
};

const repoReleasesUrl =
  'https://api.github.com/repos/LucasN0820/password-management/releases';

const desktopAssets = {
  'mac-arm64': {
    label: 'macOS Apple Silicon',
    includes: ['mac-arm64'],
    extension: '.dmg',
  },
  'mac-x64': {
    label: 'macOS Intel',
    includes: ['mac-x64'],
    extension: '.dmg',
  },
  'win-x64': {
    label: 'Windows',
    includes: ['win-x64'],
    extension: '.exe',
  },
  'linux-x64': {
    label: 'Linux',
    includes: ['linux-x64'],
    extension: '.AppImage',
  },
} as const;

type DesktopPlatform = keyof typeof desktopAssets;

function getErrorResponse(message: string, status = 404) {
  return NextResponse.json({ error: message }, { status });
}

function isGitHubErrorBody(value: unknown): value is GitHubErrorBody {
  return Boolean(value && typeof value === 'object' && 'message' in value);
}

function isDownloadTarget(target: string): target is DownloadTarget {
  return target === 'desktop' || target === 'mobile';
}

function getDesktopPlatform(request: Request): DesktopPlatform | null {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform') ?? 'mac-arm64';

  if (platform in desktopAssets) {
    return platform as DesktopPlatform;
  }

  return null;
}

function getHeaders() {
  const token = process.env.GITHUB_RELEASES_TOKEN ?? process.env.GITHUB_TOKEN;

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'password-management-landing',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function getReleases() {
  const response = await fetch(`${repoReleasesUrl}?per_page=30`, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const body = (await response.json()) as unknown;

      if (isGitHubErrorBody(body) && body.message) {
        detail = body.message;
      }
    } catch {
      // Keep the status text when GitHub does not return JSON.
    }

    throw new Error(
      `GitHub releases request failed: ${response.status} ${detail}`
    );
  }

  return (await response.json()) as GitHubRelease[];
}

function getLatestRelease(releases: GitHubRelease[], tagPrefix: string) {
  return releases.find(
    release =>
      release.tag_name.startsWith(tagPrefix) &&
      !release.draft &&
      !release.prerelease
  );
}

function getDesktopAsset(release: GitHubRelease, platform: DesktopPlatform) {
  const config = desktopAssets[platform];

  return release.assets.find(asset => {
    const name = asset.name.toLowerCase();

    return (
      name.endsWith(config.extension.toLowerCase()) &&
      config.includes.every(part => name.includes(part))
    );
  });
}

function getMobileAsset(release: GitHubRelease) {
  return release.assets.find(asset =>
    asset.name.toLowerCase().endsWith('.apk')
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ target: string }> }
) {
  const { target } = await context.params;

  if (!isDownloadTarget(target)) {
    return getErrorResponse('Unknown download target.', 400);
  }

  const platform = target === 'desktop' ? getDesktopPlatform(request) : null;

  if (target === 'desktop' && !platform) {
    return getErrorResponse('Unknown desktop platform.', 400);
  }

  try {
    const releases = await getReleases();
    const release = getLatestRelease(
      releases,
      target === 'desktop' ? 'desktop-v' : 'mobile-v'
    );

    if (!release) {
      return getErrorResponse(`No ${target} release was found.`);
    }

    const asset =
      target === 'desktop' && platform
        ? getDesktopAsset(release, platform)
        : getMobileAsset(release);

    if (!asset) {
      const assetName =
        target === 'desktop' && platform
          ? desktopAssets[platform].label
          : 'Android APK';

      return getErrorResponse(
        `No ${assetName} download was found for ${release.tag_name}.`
      );
    }

    return NextResponse.redirect(asset.browser_download_url, 302);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to resolve the latest download.';

    return getErrorResponse(message, 502);
  }
}
