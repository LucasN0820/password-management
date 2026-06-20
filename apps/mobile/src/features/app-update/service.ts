import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import {
  compareVersions,
  latestMobileRelease,
  type MobileRelease,
} from './logic';

const RELEASES_URL =
  'https://api.github.com/repos/LucasN0820/password-management/releases?per_page=30';
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;

export type AppUpdateResult =
  | { type: 'ota' }
  | { type: 'binary'; release: MobileRelease }
  | { type: 'none' }
  | { type: 'unavailable' };

let activeCheck: Promise<AppUpdateResult> | null = null;

async function checkOtaUpdate() {
  if (!Updates.isEnabled) return false;

  const result = await Updates.checkForUpdateAsync();
  if (!result.isAvailable) return false;

  const fetched = await Updates.fetchUpdateAsync();
  return fetched.isNew;
}

async function fetchLatestBinaryRelease() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(RELEASES_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GitHub releases request failed: ${response.status}`);
    }

    return latestMobileRelease(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

async function performCheck(): Promise<AppUpdateResult> {
  if (__DEV__) return { type: 'unavailable' };

  let otaError: unknown;
  try {
    if (await checkOtaUpdate()) return { type: 'ota' };
  } catch (error) {
    otaError = error;
  }

  if (Platform.OS === 'android') {
    try {
      const release = await fetchLatestBinaryRelease();
      const currentVersion =
        Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? '0.0.0';

      if (release && compareVersions(release.version, currentVersion) > 0) {
        return { type: 'binary', release };
      }
    } catch (error) {
      if (!otaError) throw error;
    }
  }

  if (otaError instanceof Error) throw otaError;
  if (otaError) throw new Error('Unable to check for OTA updates.');
  return { type: 'none' };
}

export function checkForAppUpdate() {
  if (!activeCheck) {
    activeCheck = performCheck().finally(() => {
      activeCheck = null;
    });
  }

  return activeCheck;
}

export async function applyOtaUpdate() {
  await Updates.reloadAsync();
}

export async function downloadAndInstallApk(release: MobileRelease) {
  if (Platform.OS !== 'android') {
    throw new Error('APK updates are only supported on Android.');
  }

  const file = new File(Paths.cache, `password-vault-${release.version}.apk`);
  const downloaded = await File.downloadFileAsync(release.downloadUrl, file, {
    idempotent: true,
  });
  const contentUri = await LegacyFileSystem.getContentUriAsync(downloaded.uri);

  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
    type: APK_MIME_TYPE,
  });
}
