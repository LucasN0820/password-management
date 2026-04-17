import { clipboard, contextBridge, ipcRenderer } from 'electron'
import type { Password, PasswordInput } from '@repo/db'

contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<Password[]> => ipcRenderer.invoke('get-passwords'),
  getPasswordById: (id: number): Promise<Password | null> => { return ipcRenderer.invoke('get-password-by-id', id) },
  addPassword: (data: PasswordInput): Promise<null> => { return ipcRenderer.invoke('add-password', data) },
  updatePassword: (id: number, data: PasswordInput): Promise<null> => { return ipcRenderer.invoke('update-password', id, data) },
  deletePassword: (id: number): Promise<boolean> => { return ipcRenderer.invoke('delete-password', id) },
  searchPasswords: (query: string): Promise<Password[]> => { return ipcRenderer.invoke('search-passwords', query) },
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
      addPassword: (data: PasswordInput) => Promise<null>
      updatePassword: (id: number, data: PasswordInput) => Promise<null>
      deletePassword: (id: number) => Promise<boolean>
      searchPasswords: (query: string) => Promise<Password[]>
      getCategories: () => Promise<string[]>
      copyToClipboard: (text: string) => Promise<void>
    }
  }
}
