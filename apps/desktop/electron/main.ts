import { app, BrowserWindow, ipcMain, globalShortcut, screen, nativeImage } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { PASSWORDS_TABLE_DDL, PASSWORDS_ICON_MIGRATION } from '@repo/db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null
let searchWindow: BrowserWindow | null
let db: Database.Database | null

const userDataPath = app.getPath('userData')
const dbPath = join(userDataPath, 'passwords.db')

function initDatabase() {
  try {
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }

    db = new Database(dbPath)

    db.exec(PASSWORDS_TABLE_DDL)

    // Add icon column to existing table if it doesn't exist
    try {
      db.exec(PASSWORDS_ICON_MIGRATION)
    } catch (error) {
      // Column already exists, ignore error
    }

    console.log('Database initialized at:', dbPath)
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

function createWindow() {
  const iconPath = isDev
    ? join(__dirname, '../public/icon-512.png')
    : join(process.resourcesPath, 'icon-512.png')

  let appIcon = nativeImage.createEmpty()
  try {
    if (existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath)
    }
  } catch (error) {
    console.warn('Failed to load app icon:', error)
  }

  // macOS: set Dock icon explicitly
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(appIcon)
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
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow?.on('closed', () => {
    mainWindow = null
  })
}

function createSearchWindow() {
  if (searchWindow) {
    searchWindow.show()
    searchWindow.focus()
    return
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const windowWidth = 600

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
  })

  if (isDev) {
    searchWindow.loadURL('http://localhost:5173/#/search')
  } else {
    searchWindow.loadFile(join(__dirname, '../dist/index.html'), {
      hash: '/search'
    })
  }

  searchWindow.once('ready-to-show', () => {
    searchWindow?.show()
    searchWindow?.focus()
  })

  searchWindow.on('closed', () => {
    searchWindow = null
  })

  searchWindow.on('blur', () => {
    searchWindow?.hide()
  })
}

function registerGlobalShortcuts() {
  const searchShortcut = process.platform === 'darwin' ? 'Cmd+Shift+P' : 'Ctrl+Shift+P'
  const debugShortcut = process.platform === 'darwin' ? 'F12' : 'Fn+F12'

  globalShortcut.register(searchShortcut, () => {
    createSearchWindow()
  })

  globalShortcut.register(debugShortcut, () => {
    mainWindow?.webContents.toggleDevTools()
    searchWindow?.webContents.toggleDevTools()
  })
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll()
}

app.whenReady().then(() => {
  initDatabase()
  createWindow()
  registerGlobalShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
  // Don't close database here - let it be managed by app lifecycle
})

app.on('will-quit', () => {
  unregisterGlobalShortcuts()
  if (db) {
    db.close()
  }
})

// IPC Handlers
ipcMain.handle('get-passwords', () => {
  if (!db) return []
  const stmt = db.prepare('SELECT * FROM passwords ORDER BY created_at DESC')
  return stmt.all()
})

ipcMain.handle('get-password-by-id', (_, id: number) => {
  if (!db) return null
  const stmt = db.prepare('SELECT * FROM passwords WHERE id = ?')
  return stmt.get(id)
})

ipcMain.handle('add-password', (_, data: any) => {
  if (!db) return null
  const stmt = db.prepare(`
    INSERT INTO passwords (title, username, password, url, notes, category, favorite, icon)
    VALUES (@title, @username, @password, @url, @notes, @category, @favorite, @icon)
  `)
  const result = stmt.run(data)
  return { id: result.lastInsertRowid, ...data }
})

ipcMain.handle('update-password', (_, id: number, data: any) => {
  if (!db) return null
  const stmt = db.prepare(`
    UPDATE passwords 
    SET title = @title, username = @username, password = @password, 
        url = @url, notes = @notes, category = @category, 
        favorite = @favorite, icon = @icon, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `)
  stmt.run({ ...data, id })
  return { id, ...data }
})

ipcMain.handle('delete-password', (_, id: number) => {
  if (!db) return false
  const stmt = db.prepare('DELETE FROM passwords WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
})

ipcMain.handle('search-passwords', (_, query: string) => {
  if (!db) return []
  const stmt = db.prepare(`
    SELECT * FROM passwords 
    WHERE title LIKE ? OR username LIKE ? OR url LIKE ?
    ORDER BY favorite DESC, updated_at DESC
  `)
  const searchTerm = `%${query}%`
  return stmt.all(searchTerm, searchTerm, searchTerm)
})

ipcMain.handle('get-categories', () => {
  if (!db) return []
  const stmt = db.prepare('SELECT DISTINCT category FROM passwords ORDER BY category')
  return stmt.all().map((row: any) => row.category)
})
