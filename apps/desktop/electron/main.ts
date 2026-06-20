import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  session,
  shell,
} from 'electron';
import type { z } from 'zod';
import {
  createDrizzleAdapter,
  createEncryptedAdapter,
  type DatabaseAdapter,
  type PasswordDatabase,
} from '@repo/db';
import { stopLlamaServer } from './ai-import/llama-runtime';
import { runLocalImportWorkflow } from './ai-import/local-import-workflow';
import {
  getLocalModelLibraryStatus,
  getLocalModelsDir,
  getLocalModelStatus,
  type LocalModelDownloadProgress,
  prepareLocalModel,
  removeLocalModel,
  setDefaultLocalModel,
} from './ai-import/model-cache';
import {
  RemoteImportPublicError,
  runRemoteImportWorkflow,
} from './ai-import/remote-import-workflow';
import { createDesktopDatabase } from './db';
import type { ImportFileDescriptor } from './import/types';
import {
  importPasswordsSchema,
  modelIdSchema,
  noInputSchema,
  optionalModelIdSchema,
  passwordBatchSchema,
  passwordIdSchema,
  passwordInputSchema,
  runImportWorkflowSchema,
  searchQuerySchema,
  updatePasswordSchema,
  withIpcHandler,
} from './ipc-schema';
import { getLocalAiImportConfig, getServiceEnvConfig } from './settings';
import { getOrCreateDesktopVaultKey } from './vault-key';
import {
  addContentSecurityPolicyHeader,
  attachNavigationGuards,
  SECURE_WEB_PREFERENCES,
  shouldEnableDevTools,
} from './window-security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = !app.isPackaged;
const developmentRendererUrl = 'http://localhost:5173';

let mainWindow: BrowserWindow | null;
let searchWindow: BrowserWindow | null;
let sqlite: ReturnType<typeof createDesktopDatabase>['client'] | null;
let db: PasswordDatabase | null;
let passwordAdapter: DatabaseAdapter | null;
let currentModelDownloadAbortController: AbortController | null = null;
let currentModelDownloadId: string | null = null;
let currentModelDownloadProgress: LocalModelDownloadProgress | null = null;

function registerIpcHandler<Schema extends z.ZodType, Result>(
  name: string,
  schema: Schema,
  fn: (input: z.output<Schema>) => Result | Promise<Result>
) {
  const handler = withIpcHandler(name, schema, fn);
  ipcMain.handle(name, (_event, ...args: unknown[]) =>
    handler(args.length > 1 ? args : args[0])
  );
}

const userDataPath = app.getPath('userData');
const dbPath = join(userDataPath, 'passwords.db');
function sendModelDownloadProgress(progress: LocalModelDownloadProgress) {
  currentModelDownloadProgress = ['completed', 'cancelled', 'failed'].includes(
    progress.status
  )
    ? null
    : progress;
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('local-import-model-download-progress', progress);
  });
}

function initDatabase() {
  try {
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }

    const database = createDesktopDatabase(dbPath);
    sqlite = database.client;
    db = database.db;
    passwordAdapter = createEncryptedAdapter(
      createDrizzleAdapter(db),
      async () => getOrCreateDesktopVaultKey(),
      length => randomBytes(length)
    );

    console.log('Database initialized at:', dbPath);
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

function installContentSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders:
        details.resourceType === 'mainFrame'
          ? addContentSecurityPolicyHeader(details.responseHeaders, isDev)
          : details.responseHeaders,
    });
  });
}

function getRendererEntryUrl() {
  return isDev
    ? `${developmentRendererUrl}/`
    : pathToFileURL(join(__dirname, '../dist/index.html')).toString();
}

function createWindow() {
  const iconPath = isDev
    ? join(__dirname, '../public/icon-512.png')
    : join(process.resourcesPath, 'icon-512.png');

  let appIcon = nativeImage.createEmpty();
  try {
    if (existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath);
    }
  } catch (error) {
    console.warn('Failed to load app icon:', error);
  }

  // macOS: set Dock icon explicitly
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(appIcon);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: appIcon,
    webPreferences: {
      ...SECURE_WEB_PREFERENCES,
      preload: join(__dirname, '../dist-electron/preload.js'),
      devTools: shouldEnableDevTools(app.isPackaged),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  attachNavigationGuards(mainWindow.webContents, getRendererEntryUrl());

  if (isDev) {
    mainWindow.loadURL(developmentRendererUrl);
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (shouldEnableDevTools(app.isPackaged)) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow?.on('closed', () => {
    mainWindow = null;
  });
}

function createSearchWindow() {
  if (searchWindow) {
    searchWindow.show();
    searchWindow.focus();
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 600;

  searchWindow = new BrowserWindow({
    width: windowWidth,
    height,
    x: Math.round((width - windowWidth) / 2),
    y: 10,
    webPreferences: {
      ...SECURE_WEB_PREFERENCES,
      preload: join(__dirname, '../dist-electron/preload.js'),
      devTools: shouldEnableDevTools(app.isPackaged),
    },
    frame: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
  });

  attachNavigationGuards(searchWindow.webContents, getRendererEntryUrl());

  if (isDev) {
    searchWindow.loadURL(`${developmentRendererUrl}/#/search`);
  } else {
    searchWindow.loadFile(join(__dirname, '../dist/index.html'), {
      hash: '/search',
    });
  }

  searchWindow.once('ready-to-show', () => {
    searchWindow?.show();
    searchWindow?.focus();
  });

  searchWindow.on('closed', () => {
    searchWindow = null;
  });

  searchWindow.on('blur', () => {
    searchWindow?.hide();
  });
}

function registerGlobalShortcuts() {
  const searchShortcut =
    process.platform === 'darwin' ? 'Cmd+Shift+P' : 'Ctrl+Shift+P';

  globalShortcut.register(searchShortcut, () => {
    createSearchWindow();
  });

  if (shouldEnableDevTools(app.isPackaged)) {
    const debugShortcut = process.platform === 'darwin' ? 'F12' : 'Fn+F12';
    globalShortcut.register(debugShortcut, () => {
      mainWindow?.webContents.toggleDevTools();
      searchWindow?.webContents.toggleDevTools();
    });
  }
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}

app.whenReady().then(() => {
  installContentSecurityPolicy();
  initDatabase();
  createWindow();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  // Don't close database here - let it be managed by app lifecycle
});

app.on('will-quit', () => {
  unregisterGlobalShortcuts();
  if (sqlite) {
    sqlite.close();
  }
});

// IPC Handlers
registerIpcHandler('get-passwords', noInputSchema, () => {
  if (!passwordAdapter) {
    return [];
  }
  return passwordAdapter.getPasswords();
});

registerIpcHandler('get-password-by-id', passwordIdSchema, id => {
  if (!passwordAdapter) {
    return null;
  }
  return passwordAdapter.getPasswordById(id);
});

registerIpcHandler('add-password', passwordInputSchema, data => {
  if (!passwordAdapter) {
    return null;
  }
  return passwordAdapter.addPassword(data);
});

registerIpcHandler('add-passwords', passwordBatchSchema, data => {
  if (!passwordAdapter) {
    return null;
  }
  return passwordAdapter.addPasswords(data);
});

registerIpcHandler('update-password', updatePasswordSchema, ([id, data]) => {
  if (!passwordAdapter) {
    return null;
  }
  return passwordAdapter.updatePassword(id, data);
});

registerIpcHandler('delete-password', passwordIdSchema, id => {
  if (!passwordAdapter) {
    return false;
  }
  return passwordAdapter.deletePassword(id);
});

registerIpcHandler('search-passwords', searchQuerySchema, query => {
  if (!passwordAdapter) {
    return [];
  }
  return passwordAdapter.searchPasswords(query);
});

registerIpcHandler('get-categories', noInputSchema, () => {
  if (!passwordAdapter) {
    return [];
  }
  return passwordAdapter.getCategories();
});

registerIpcHandler('get-local-import-model-status', noInputSchema, async () =>
  getLocalModelStatus(getLocalAiImportConfig())
);

registerIpcHandler(
  'get-local-import-model-library-status',
  noInputSchema,
  async () => getLocalModelLibraryStatus(getLocalAiImportConfig())
);

registerIpcHandler(
  'get-local-import-model-download-progress',
  noInputSchema,
  () => currentModelDownloadProgress
);

registerIpcHandler(
  'prepare-local-import-model',
  optionalModelIdSchema,
  async modelId => {
    if (currentModelDownloadAbortController) {
      throw new Error(
        `A model download is already running: ${currentModelDownloadId}`
      );
    }

    const config = getLocalAiImportConfig();
    const abortController = new AbortController();
    currentModelDownloadAbortController = abortController;
    currentModelDownloadId = modelId ?? null;

    try {
      await prepareLocalModel(
        config,
        modelId,
        abortController.signal,
        sendModelDownloadProgress
      );
    } catch (error) {
      // Cancellation is a user action, not a failure worth propagating.
      if (!abortController.signal.aborted) {
        throw error;
      }
    } finally {
      currentModelDownloadAbortController = null;
      currentModelDownloadId = null;
      currentModelDownloadProgress = null;
    }

    return getLocalModelLibraryStatus(config);
  }
);

registerIpcHandler(
  'set-default-local-import-model',
  modelIdSchema,
  async modelId => {
    await setDefaultLocalModel(modelId);
    return getLocalModelLibraryStatus(getLocalAiImportConfig());
  }
);

registerIpcHandler(
  'cancel-local-import-model-download',
  noInputSchema,
  async () => {
    currentModelDownloadAbortController?.abort();
    return getLocalModelLibraryStatus(getLocalAiImportConfig());
  }
);

registerIpcHandler(
  'remove-local-import-model',
  modelIdSchema,
  async modelId => {
    if (currentModelDownloadId === modelId) {
      throw new Error('Cancel the active download before removing this model.');
    }

    stopLlamaServer();
    await removeLocalModel(modelId);
    return getLocalModelLibraryStatus(getLocalAiImportConfig());
  }
);

registerIpcHandler(
  'open-local-import-model-folder',
  noInputSchema,
  async () => {
    const modelsDir = getLocalModelsDir();
    mkdirSync(modelsDir, { recursive: true });
    await shell.openPath(modelsDir);
  }
);

registerIpcHandler('select-import-files', noInputSchema, async () => {
  const browserWindow =
    BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
  const options = {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Supported files',
        extensions: ['csv', 'pdf', 'docx', 'md', 'markdown', 'txt'],
      },
    ],
  } satisfies Electron.OpenDialogOptions;
  const result = browserWindow
    ? await dialog.showOpenDialog(browserWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled) {
    return [];
  }

  return result.filePaths.map(filePath => {
    const stats = statSync(filePath);
    const lastDot = filePath.lastIndexOf('.');
    const extension = lastDot > 0 ? filePath.slice(lastDot).toLowerCase() : '';
    return {
      path: filePath,
      name: filePath.split(/[/\\]/).pop() ?? filePath,
      size: stats.size,
      extension,
    } satisfies ImportFileDescriptor;
  });
});

let currentImportJobId: string | null = null;
let currentImportAbortController: AbortController | null = null;

registerIpcHandler(
  'run-import-workflow',
  runImportWorkflowSchema,
  async ([files, options]) => {
    const abortController = new AbortController();
    currentImportAbortController = abortController;
    currentImportJobId = null;

    try {
      const config = getLocalAiImportConfig();
      if (config.provider === 'remote-service') {
        const { url: serviceUrl, secret } = getServiceEnvConfig();
        if (!serviceUrl || !secret) {
          throw new RemoteImportPublicError('AI_IMPORT_NOT_CONFIGURED');
        }
        try {
          return await runRemoteImportWorkflow({
            files,
            serviceUrl,
            secret,
            signal: abortController.signal,
            onJobCreated: jobId => {
              currentImportJobId = jobId;
            },
          });
        } catch (error) {
          console.error('[AI import] Remote workflow failed:', error);
          if (error instanceof RemoteImportPublicError) {
            throw error;
          }
          throw new RemoteImportPublicError('AI_IMPORT_REMOTE_FAILED');
        }
      }
      return await runLocalImportWorkflow(
        files,
        abortController.signal,
        options?.modelId,
        sendModelDownloadProgress
      );
    } finally {
      currentImportJobId = null;
      currentImportAbortController = null;
    }
  }
);

registerIpcHandler('cancel-import-workflow', noInputSchema, async () => {
  const { url: serviceUrl, secret } = getServiceEnvConfig();
  const jobId = currentImportJobId;

  if (jobId && serviceUrl && secret) {
    // Cancel the server-side job
    await fetch(`${serviceUrl}/import/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    }).catch(() => undefined);
  }

  // Abort the local polling loop
  currentImportAbortController?.abort();
  stopLlamaServer();
  currentImportJobId = null;
  currentImportAbortController = null;
});

registerIpcHandler(
  'save-imported-passwords',
  importPasswordsSchema,
  async candidates => {
    if (!passwordAdapter) {
      return { saved: 0 };
    }
    await passwordAdapter.addPasswords(
      candidates.map(record => {
        return {
          title: record.title,
          username: record.username,
          password: record.password,
          url: record.url,
          notes: record.notes,
          category: 'imported',
          isFavorite: false,
          icon: null,
          totp_secret: null,
        };
      })
    );

    return { saved: candidates.length };
  }
);
