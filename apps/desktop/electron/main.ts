import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
} from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, statSync } from 'fs';
import { z } from 'zod';
import {
  addPassword,
  deletePassword,
  getCategories,
  getPasswordById,
  getPasswords,
  searchPasswords,
  updatePassword,
  type PasswordDatabase,
  type PasswordInput,
} from '@repo/db';
import { createDesktopDatabase } from './db';
import { getServiceEnvConfig } from './settings';
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
  if (!db) return [];
  return getPasswords(db);
});

ipcMain.handle('get-password-by-id', (_, id: number) => {
  if (!db) return null;
  return getPasswordById(db, id);
});

ipcMain.handle('add-password', (_, data: PasswordInput) => {
  if (!db) return null;
  return addPassword(db, data);
});

ipcMain.handle('update-password', (_, id: number, data: PasswordInput) => {
  if (!db) return null;
  return updatePassword(db, id, data);
});

ipcMain.handle('delete-password', (_, id: number) => {
  if (!db) return false;
  return deletePassword(db, id);
});

ipcMain.handle('search-passwords', (_, query: string) => {
  if (!db) return [];
  return searchPasswords(db, query);
});

ipcMain.handle('get-categories', () => {
  if (!db) return [];
  return getCategories(db);
});

ipcMain.handle('select-import-files', async () => {
  const browserWindow =
    BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
  const options = {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Supported files',
        extensions: [
          'csv',
          'pdf',
          'docx',
          'md',
          'markdown',
          'txt',
          'jpg',
          'jpeg',
          'png',
          'webp',
        ],
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

ipcMain.handle(
  'run-import-workflow',
  async (_, files: ImportFileDescriptor[]) => {
    const { url: serviceUrl, secret } = getServiceEnvConfig();

    if (!serviceUrl || !secret) {
      throw new Error('Env not found.');
    }

    const formData = new FormData();
    for (const file of files) {
      const response = await fetch(`file://${file.path}`);
      const blob = await response.blob();
      formData.append('files', blob, file.name);
    }

    // Create job
    const createResponse = await fetch(`${serviceUrl}/import/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      body: formData,
    });

    if (!createResponse.ok) {
      const error = await createResponse
        .json()
        .catch(() => ({ error: { message: 'Failed to create import job' } }));
      throw new Error(error.error?.message || 'Failed to create import job');
    }

    const { jobId } = (await createResponse.json()) as { jobId: string };

    // Poll for completion
    while (true) {
      const statusResponse = await fetch(`${serviceUrl}/import/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
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
        return job.result;
      }
      if (job.status === 'failed') {
        throw new Error(job.error?.message || 'Import job failed');
      }
      if (job.status === 'cancelled') {
        throw new Error('Import was cancelled');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
);

ipcMain.handle(
  'save-imported-passwords',
  (_, candidates: ImportPasswordInput[]) => {
    if (!db || !sqlite) return { saved: 0 };
    const passwordDb = db;
    const parsedCandidates = importPasswordsSchema.parse(candidates);
    let saved = 0;

    const transaction = sqlite.transaction((records: ImportPasswordInput[]) => {
      for (const record of records) {
        addPassword(passwordDb, {
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
    });

    transaction(parsedCandidates);

    return { saved };
  }
);
