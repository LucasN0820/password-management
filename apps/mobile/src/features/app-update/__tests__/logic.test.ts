import { describe, expect, it } from 'vitest';
import { compareVersions, latestMobileRelease } from '../logic';

describe('compareVersions', () => {
  it('compares numeric segments instead of lexical text', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersions('2.0', '2.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
  });
});

describe('latestMobileRelease', () => {
  it('finds the newest stable mobile release with an APK', () => {
    expect(
      latestMobileRelease([
        {
          tag_name: 'desktop-v9.0.0',
          assets: [{ name: 'desktop.exe', browser_download_url: 'desktop' }],
        },
        {
          tag_name: 'mobile-v1.9.0',
          assets: [{ name: 'old.apk', browser_download_url: 'old' }],
        },
        {
          tag_name: 'mobile-v1.10.0',
          assets: [
            { name: 'android-release.apk', browser_download_url: 'new' },
          ],
        },
      ])
    ).toEqual({ version: '1.10.0', downloadUrl: 'new' });
  });

  it('ignores drafts, prereleases, and releases without APK assets', () => {
    expect(
      latestMobileRelease([
        { tag_name: 'mobile-v2.0.0', draft: true, assets: [] },
        { tag_name: 'mobile-v1.1.0', prerelease: true, assets: [] },
        { tag_name: 'mobile-v1.0.0', assets: [{ name: 'notes.txt' }] },
      ])
    ).toBeNull();
  });
});
