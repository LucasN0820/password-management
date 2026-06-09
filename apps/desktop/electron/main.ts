import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  shell,
} from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, statSync } from 'fs';
import { readFile } from 'fs/promises';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import {
  createDrizzleAdapter,
  createEncryptedAdapter,
  type PasswordDatabase,
  type DatabaseAdapter,
  type PasswordInput,
} from '@repo/db';
import { createDesktopDatabase } from './db';
import { getLocalAiImportConfig, getServiceEnvConfig } from './settings';
import { getOrCreateDesktopVaultKey } from './vault-key';
import { runLocalImportWorkflow } from './ai-import/local-import-workflow';
import { stopLlamaServer } from './ai-import/llama-runtime';
import {
  getLocalModelStatus,
  getLocalModelLibraryStatus,
  getLocalModelsDir,
  prepareLocalModel,
  registerLocalModelFile,
  setDefaultLocalModel,
} from './ai-import/model-cache';
import type {
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
} from './import/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null;
let searchWindow: BrowserWindow | null;
let sqlite: ReturnType<typeof createDesktopDatabase>['client'] | null;
let db: PasswordDatabase | null;
let passwordAdapter: DatabaseAdapter | null;

const userDataPath = app.getPath('userData');
const dbPath = join(userDataPath, 'passwords.db');
const importPasswordSchema = z.object({
  title: z.string(),
  username: z.string(),
  password: z.string().min(1),
  url: z.string().nullable(),
  notes: z.string().nullable(),
});
const importPasswordsSchema = z.array(importPasswordSchema);

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
      preload: join(__dirname, '../dist-electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
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
      preload: join(__dirname, '../dist-electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
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

  if (isDev) {
    searchWindow.loadURL('http://localhost:5173/#/search');
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
  const debugShortcut = process.platform === 'darwin' ? 'F12' : 'Fn+F12';

  globalShortcut.register(searchShortcut, () => {
    createSearchWindow();
  });

  globalShortcut.register(debugShortcut, () => {
    mainWindow?.webContents.toggleDevTools();
    searchWindow?.webContents.toggleDevTools();
  });
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}

app.whenReady().then(() => {
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
ipcMain.handle('get-passwords', () => {
  if (!passwordAdapter) return [];
  return passwordAdapter.getPasswords();
});

ipcMain.handle('get-password-by-id', (_, id: number) => {
  if (!passwordAdapter) return null;
  return passwordAdapter.getPasswordById(id);
});

ipcMain.handle('add-password', (_, data: PasswordInput) => {
  if (!passwordAdapter) return null;
  return passwordAdapter.addPassword(data);
});

ipcMain.handle('update-password', (_, id: number, data: PasswordInput) => {
  if (!passwordAdapter) return null;
  return passwordAdapter.updatePassword(id, data);
});

ipcMain.handle('delete-password', (_, id: number) => {
  if (!passwordAdapter) return false;
  return passwordAdapter.deletePassword(id);
});

ipcMain.handle('search-passwords', (_, query: string) => {
  if (!passwordAdapter) return [];
  return passwordAdapter.searchPasswords(query);
});

ipcMain.handle('get-categories', () => {
  if (!passwordAdapter) return [];
  return passwordAdapter.getCategories();
});

ipcMain.handle('get-local-import-model-status', async () => {
  return getLocalModelStatus(getLocalAiImportConfig());
});

ipcMain.handle('get-local-import-model-library-status', async () => {
  return getLocalModelLibraryStatus(getLocalAiImportConfig());
});

ipcMain.handle('prepare-local-import-model', async (_, modelId?: string) => {
  const config = getLocalAiImportConfig();
  await prepareLocalModel(config, modelId);
  return getLocalModelLibraryStatus(config);
});

ipcMain.handle('set-default-local-import-model', async (_, modelId: string) => {
  await setDefaultLocalModel(modelId);
  return getLocalModelLibraryStatus(getLocalAiImportConfig());
});

ipcMain.handle('open-local-import-model-folder', async () => {
  const modelsDir = getLocalModelsDir();
  mkdirSync(modelsDir, { recursive: true });
  await shell.openPath(modelsDir);
});

ipcMain.handle('select-local-import-model-file', async () => {
  const browserWindow =
    BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
  const options = {
    properties: ['openFile'],
    filters: [
      {
        name: 'GGUF models',
        extensions: ['gguf'],
      },
    ],
  } satisfies Electron.OpenDialogOptions;
  const result = browserWindow
    ? await dialog.showOpenDialog(browserWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled || !result.filePaths[0]) {
    return getLocalModelLibraryStatus(getLocalAiImportConfig());
  }

  await registerLocalModelFile(result.filePaths[0]);
  return getLocalModelLibraryStatus(getLocalAiImportConfig());
});

ipcMain.handle('select-import-files', async () => {
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

async function runRemoteImportWorkflow(
  files: ImportFileDescriptor[],
  abortController: AbortController
) {
  const { url: serviceUrl, secret } = getServiceEnvConfig();

  if (!serviceUrl || !secret) {
    throw new Error('Env not found.');
  }

  const formData = new FormData();
  for (const file of files) {
    const buffer = await readFile(file.path);
    const blob = new Blob([buffer]);
    formData.append('files', blob, file.name);
  }

  const createResponse = await fetch(`${serviceUrl}/import/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
    },
    body: formData,
    signal: abortController.signal,
  });

  if (!createResponse.ok) {
    const error = await createResponse
      .json()
      .catch(() => ({ error: { message: 'Failed to create import job' } }));
    throw new Error(error.error?.message || 'Failed to create import job');
  }

  const { jobId } = (await createResponse.json()) as { jobId: string };
  currentImportJobId = jobId;

  while (!abortController.signal.aborted) {
    const statusResponse = await fetch(`${serviceUrl}/import/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      signal: abortController.signal,
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to get import job status');
    }

    const job = (await statusResponse.json()) as {
      status: string;
      result?: ImportWorkflowResult;
      error?: { code: string; message: string };
    };

    if (job.status === 'completed') {
      if (!job.result) {
        throw new Error('Import job completed without a result');
      }
      return job.result;
    }
    if (job.status === 'failed') {
      throw new Error(job.error?.message || 'Import job failed');
    }
    if (job.status === 'cancelled') {
      throw new Error('Import was cancelled');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Import was cancelled');
}

ipcMain.handle(
  'run-import-workflow',
  async (_, files: ImportFileDescriptor[], options?: { modelId?: string }) => {
    const abortController = new AbortController();
    currentImportAbortController = abortController;
    currentImportJobId = null;

    try {
      const config = getLocalAiImportConfig();
      return config.provider === 'remote-service'
        ? await runRemoteImportWorkflow(files, abortController)
        : await runLocalImportWorkflow(
            files,
            abortController.signal,
            options?.modelId
          );
    } finally {
      currentImportJobId = null;
      currentImportAbortController = null;
    }
  }
);

ipcMain.handle('cancel-import-workflow', async () => {
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

ipcMain.handle(
  'save-imported-passwords',
  async (_, candidates: ImportPasswordInput[]) => {
    if (!passwordAdapter) return { saved: 0 };
    const parsedCandidates = importPasswordsSchema.parse(candidates);
    let saved = 0;

    for (const record of parsedCandidates) {
      await passwordAdapter.addPassword({
        title: record.title,
        username: record.username,
        password: record.password,
        url: record.url,
        notes: record.notes,
        category: 'imported',
        isFavorite: false,
        icon: null,
      });
      saved += 1;
    }

    return { saved };
  }
);
