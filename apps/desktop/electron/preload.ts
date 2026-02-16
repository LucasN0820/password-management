import { contextBridge, ipcRenderer, clipboard } from 'electron'

export interface Password {
  id: number
  title: string
  username: string
  password: string
  url: string
  notes: string
  category: string
  favorite: number
  created_at: string
  updated_at: string
}

export interface PasswordInput {
  title: string
  username: string
  password: string
  url: string
  notes: string
  category: string
  favorite: number
}

contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<Password[]> => ipcRenderer.invoke('get-passwords'),
  getPasswordById: (id: number): Promise<Password | null> => ipcRenderer.invoke('get-password-by-id', id),
  addPassword: (data: PasswordInput): Promise<Password | null> => ipcRenderer.invoke('add-password', data),
  updatePassword: (id: number, data: PasswordInput): Promise<Password | null> => ipcRenderer.invoke('update-password', id, data),
  deletePassword: (id: number): Promise<boolean> => ipcRenderer.invoke('delete-password', id),
  searchPasswords: (query: string): Promise<Password[]> => ipcRenderer.invoke('search-passwords', query),
  getCategories: (): Promise<string[]> => ipcRenderer.invoke('get-categories'),
  copyToClipboard: (text: string): Promise<void> => {
    clipboard.writeText(text)
    return Promise.resolve()
  },
})

declare global {
  interface Window {
    electronAPI: {
      getPasswords: () => Promise<Password[]>
      getPasswordById: (id: number) => Promise<Password | null>
      addPassword: (data: PasswordInput) => Promise<Password | null>
      updatePassword: (id: number, data: PasswordInput) => Promise<Password | null>
      deletePassword: (id: number) => Promise<boolean>
      searchPasswords: (query: string) => Promise<Password[]>
      getCategories: () => Promise<string[]>
      copyToClipboard: (text: string) => Promise<void>
    }
  }
}
