import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUInstallStatus,
  IAUUpdateKind,
  type StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';
import {
  compareVersions,
  latestMobileRelease,
  type MobileRelease,
} from './logic';

const RELEASES_URL =
  'https://api.github.com/repos/LucasN0820/password-management/releases?per_page=30';
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;
// Only builds distributed as a sideloaded APK (the `direct` EAS Update channel)
// may self-update from GitHub Releases. Play Store installs are signed with a
// different key, so prompting them to sideload would fail to install — they
// receive native updates through Google Play In-App Updates instead.
const DIRECT_INSTALL_CHANNEL = 'direct';
const PLAY_CHANNEL = 'production';

export type AppUpdateResult =
  | { type: 'ota' }
  | { type: 'binary'; release: MobileRelease }
  | { type: 'play' }
  | { type: 'none' }
  | { type: 'unavailable' };

let inAppUpdates: SpInAppUpdates | null = null;

/**
 * Constructed lazily and only on the Play path so the native module is never
 * touched on iOS or sideloaded builds.
 */
function getInAppUpdates() {
  if (!inAppUpdates) {
    inAppUpdates = new SpInAppUpdates(false);
  }
  return inAppUpdates;
}

function currentAppVersion(): string {
  const nativeVersion = Constants.nativeAppVersion as string | null;
  return nativeVersion ?? Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * Whether Google Play has a newer build available. The decision is deferred to
 * Play Core's versionCode-based availability via `customVersionComparator`
 * (returning 1 always) — the library would otherwise semver-compare the store
 * versionCode integer against our versionName, which is apples-to-oranges.
 * `curVersion` is still passed so the library doesn't fall back to
 * react-native-device-info's `getVersion()`, which we otherwise never call.
 */
async function checkPlayNeedsUpdate() {
  const result = await getInAppUpdates().checkNeedsUpdate({
    customVersionComparator: () => 1,
    curVersion: currentAppVersion(),
  });
  return result.shouldUpdate;
}

/**
 * Run Google Play's flexible in-app update: Play shows its own consent sheet
 * and downloads in the background, then `onDownloaded` fires so the caller can
 * prompt the user to restart. The actual install happens in {@link completePlayUpdate}.
 */
export async function startPlayFlexibleUpdate(onDownloaded: () => void) {
  const updates = getInAppUpdates();

  const listener = (event: StatusUpdateEvent) => {
    if (event.status === IAUInstallStatus.DOWNLOADED) {
      updates.removeStatusUpdateListener(listener);
      onDownloaded();
    }
  };
  updates.addStatusUpdateListener(listener);

  try {
    await updates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
  } catch (error) {
    updates.removeStatusUpdateListener(listener);
    throw error;
  }
}

export function completePlayUpdate() {
  getInAppUpdates().installUpdate();
}

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
      if (Updates.channel === DIRECT_INSTALL_CHANNEL) {
        const release = await fetchLatestBinaryRelease();
        if (
          release &&
          compareVersions(release.version, currentAppVersion()) > 0
        ) {
          return { type: 'binary', release };
        }
      } else if (
        Updates.channel === PLAY_CHANNEL &&
        (await checkPlayNeedsUpdate())
      ) {
        return { type: 'play' };
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

export async function downloadAndInstallApk(
  release: MobileRelease,
  onProgress?: (fraction: number) => void
) {
  if (Platform.OS !== 'android') {
    throw new Error('APK updates are only supported on Android.');
  }

  const targetUri = `${LegacyFileSystem.cacheDirectory ?? ''}password-vault-${release.version}.apk`;
  const download = LegacyFileSystem.createDownloadResumable(
    release.downloadUrl,
    targetUri,
    {},
    progress => {
      const total = progress.totalBytesExpectedToWrite;
      if (total > 0) {
        onProgress?.(progress.totalBytesWritten / total);
      }
    }
  );

  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error('APK download failed.');
  }

  const contentUri = await LegacyFileSystem.getContentUriAsync(result.uri);

  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
    type: APK_MIME_TYPE,
  });
}
