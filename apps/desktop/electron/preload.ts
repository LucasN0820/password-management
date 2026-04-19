import { clipboard, contextBridge, ipcRenderer } from 'electron'
import type { Password, PasswordInput } from '@repo/db'
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
} from './import/types'

contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<Password[]> => ipcRenderer.invoke('get-passwords'),
  getPasswordById: (id: number): Promise<Password | null> => { return ipcRenderer.invoke('get-password-by-id', id) },
  addPassword: (data: PasswordInput): Promise<Password | null> => { return ipcRenderer.invoke('add-password', data) },
  updatePassword: (id: number, data: PasswordInput): Promise<Password | null> => { return ipcRenderer.invoke('update-password', id, data) },
  deletePassword: (id: number): Promise<boolean> => { return ipcRenderer.invoke('delete-password', id) },
  searchPasswords: (query: string): Promise<Password[]> => { return ipcRenderer.invoke('search-passwords', query) },
  getCategories: (): Promise<string[]> => ipcRenderer.invoke('get-categories'),
  selectImportFiles: (): Promise<ImportFileDescriptor[]> => ipcRenderer.invoke('select-import-files'),
  runImportWorkflow: (files: ImportFileDescriptor[]): Promise<ImportWorkflowResult> =>
    ipcRenderer.invoke('run-import-workflow', files),
  saveImportedPasswords: (candidates: ImportPasswordInput[]): Promise<{ saved: number }> =>
    ipcRenderer.invoke('save-imported-passwords', candidates),
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
      selectImportFiles: () => Promise<ImportFileDescriptor[]>
      runImportWorkflow: (files: ImportFileDescriptor[]) => Promise<ImportWorkflowResult>
      saveImportedPasswords: (
        candidates: ImportPasswordInput[],
      ) => Promise<{ saved: number }>
      copyToClipboard: (text: string) => Promise<void>
    }
  }
}

export type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
}
