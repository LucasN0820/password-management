import { app, type BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';
import electronUpdater, {
  type ProgressInfo,
  type UpdateInfo,
} from 'electron-updater';
import { noInputSchema, withIpcHandler } from './ipc-schema';

// electron-updater is CommonJS; under the ESM main bundle we import the
// default export and destructure (the documented electron-vite workaround).
const { autoUpdater } = electronUpdater;

const GITHUB_OWNER = 'LucasN0820';
const GITHUB_REPO = 'password-management';
const DESKTOP_TAG_PREFIX = 'desktop-v';
const UPDATE_STATUS_CHANNEL = 'auto-update-status';
// Delay the startup check so window creation / DB init are not contended.
const STARTUP_CHECK_DELAY_MS = 3000;

export type AutoUpdateState =
  | 'idle'
  | 'dev-disabled'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface AutoUpdateStatus {
  state: AutoUpdateState;
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
}

let getMainWindow: () => BrowserWindow | null = () => null;
let lastStatus: AutoUpdateStatus = { state: 'idle' };
let eventsBound = false;

function broadcastStatus(status: AutoUpdateStatus) {
  lastStatus = status;
  const window = getMainWindow();
  if (window && !window.isDestroyed()) {
    window.webContents.send(UPDATE_STATUS_CHANNEL, status);
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return typeof error === 'string' && error ? error : 'Unknown update error';
}

function versionFromTag(tag: string): string {
  return tag.slice(DESKTOP_TAG_PREFIX.length);
}

/**
 * Numeric major.minor.patch comparison; positive when `a` is newer than `b`.
 */
function compareVersion(a: string, b: string): number {
  const pa = a.split('.');
  const pb = b.split('.');
  for (let i = 0; i < 3; i = i + 1) {
    const diff =
      (Number.parseInt(pa[i] ?? '0', 10) || 0) -
      (Number.parseInt(pb[i] ?? '0', 10) || 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
}

function isPublishedDesktopRelease(release: GitHubRelease): boolean {
  return (
    !release.draft &&
    !release.prerelease &&
    typeof release.tag_name === 'string' &&
    release.tag_name.startsWith(DESKTOP_TAG_PREFIX)
  );
}

/**
 * This repository publishes both `desktop-v*` and `mobile-v*` GitHub Releases.
 * Electron-updater's default GitHub provider only inspects the single latest
 * release, which may be a mobile build with no desktop `latest.yml`. We instead
 * resolve the newest published desktop release and point a generic feed at its
 * asset folder.
 */
async function resolveLatestDesktopTag(): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=50`,
    {
      headers: {
        'User-Agent': `${app.getName()}-updater`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub releases request failed (${response.status})`);
  }

  const releases = (await response.json()) as GitHubRelease[];
  const desktopTags = releases
    .filter(isPublishedDesktopRelease)
    .map(release => release.tag_name);

  let latestTag: string | null = null;
  for (const tag of desktopTags) {
    if (
      latestTag === null ||
      compareVersion(versionFromTag(tag), versionFromTag(latestTag)) > 0
    ) {
      latestTag = tag;
    }
  }

  return latestTag;
}

function bindAutoUpdaterEvents() {
  if (eventsBound) {
    return;
  }
  eventsBound = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = log;
  log.transports.file.level = 'info';

  autoUpdater.on('checking-for-update', () => {
    broadcastStatus({ state: 'checking' });
  });
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    broadcastStatus({ state: 'available', version: info.version });
  });
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    broadcastStatus({ state: 'not-available', version: info.version });
  });
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    broadcastStatus({
      state: 'downloading',
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    broadcastStatus({ state: 'downloaded', version: info.version });
  });
  autoUpdater.on('error', (error: Error | null) => {
    broadcastStatus({ state: 'error', error: describeError(error) });
  });
}

async function runUpdateCheck(): Promise<AutoUpdateStatus> {
  if (!app.isPackaged) {
    const status: AutoUpdateStatus = { state: 'dev-disabled' };
    broadcastStatus(status);
    return status;
  }

  try {
    bindAutoUpdaterEvents();
    const tag = await resolveLatestDesktopTag();
    if (!tag) {
      const status: AutoUpdateStatus = { state: 'not-available' };
      broadcastStatus(status);
      return status;
    }

    autoUpdater.setFeedURL({
      provider: 'generic',
      url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${tag}`,
    });
    broadcastStatus({ state: 'checking' });
    await autoUpdater.checkForUpdates();
    return lastStatus;
  } catch (error) {
    const status: AutoUpdateStatus = {
      state: 'error',
      error: describeError(error),
    };
    broadcastStatus(status);
    return status;
  }
}

/**
 * Wire the auto-updater. No-op in development (electron-updater throws when the
 * app is not packaged). Performs one check shortly after startup.
 */
export function setupAutoUpdater(getWindow: () => BrowserWindow | null) {
  getMainWindow = getWindow;
  if (!app.isPackaged) {
    return;
  }

  bindAutoUpdaterEvents();
  setTimeout(() => {
    runUpdateCheck().catch(error => {
      log.error('Auto-update startup check failed', error);
    });
  }, STARTUP_CHECK_DELAY_MS);
}

function handleNoInput<Result>(name: string, fn: () => Result | Promise<Result>) {
  const handler = withIpcHandler(name, noInputSchema, fn);
  ipcMain.handle(name, () => handler(undefined));
}

export function registerAutoUpdaterIpc() {
  handleNoInput('auto-update:check', () => runUpdateCheck());

  handleNoInput('auto-update:download', () => {
    if (!app.isPackaged) {
      return { state: 'dev-disabled' } as AutoUpdateStatus;
    }
    autoUpdater.downloadUpdate().catch(error => {
      broadcastStatus({ state: 'error', error: describeError(error) });
    });
    return lastStatus;
  });

  handleNoInput('auto-update:quit-and-install', () => {
    if (app.isPackaged) {
      // Let the IPC reply flush before the app quits to install.
      setTimeout(() => {
        autoUpdater.quitAndInstall();
      }, 100);
    }
    return { acknowledged: true };
  });
}
