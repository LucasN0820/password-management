import { clipboard, contextBridge, ipcRenderer } from 'electron'

/** Raw SQLite row shape (favorite is INTEGER 0|1) */
export interface PasswordRow {
  id: number
  title: string
  username: string
  password: string
  url: string
  notes: string
  category: string
  favorite: number
  icon?: string
  created_at: string
  updated_at: string
}

export interface PasswordRowInput {
  title: string
  username: string
  password: string
  url: string | null
  notes: string | null
  category: string
  favorite: number
  icon: string | null
}

contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<PasswordRow[]> => ipcRenderer.invoke('get-passwords'),
  getPasswordById: (id: number): Promise<PasswordRow | null> => { return ipcRenderer.invoke('get-password-by-id', id) },
  addPassword: (data: PasswordRowInput): Promise<PasswordRow | null> => { return ipcRenderer.invoke('add-password', data) },
  updatePassword: (id: number, data: PasswordRowInput): Promise<PasswordRow | null> => { return ipcRenderer.invoke('update-password', id, data) },
  deletePassword: (id: number): Promise<boolean> => { return ipcRenderer.invoke('delete-password', id) },
  searchPasswords: (query: string): Promise<PasswordRow[]> => { return ipcRenderer.invoke('search-passwords', query) },
  getCategories: (): Promise<string[]> => ipcRenderer.invoke('get-categories'),
  copyToClipboard: (text: string): Promise<void> => {
    clipboard.writeText(text)

    return Promise.resolve()
  },
})

declare global {
  interface Window {
    electronAPI: {
      getPasswords: () => Promise<PasswordRow[]>
      getPasswordById: (id: number) => Promise<PasswordRow | null>
      addPassword: (data: PasswordRowInput) => Promise<PasswordRow | null>
      updatePassword: (id: number, data: PasswordRowInput) => Promise<PasswordRow | null>
      deletePassword: (id: number) => Promise<boolean>
      searchPasswords: (query: string) => Promise<PasswordRow[]>
      getCategories: () => Promise<string[]>
      copyToClipboard: (text: string) => Promise<void>
    }
  }
}
