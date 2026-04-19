import { clipboard, contextBridge, ipcRenderer } from 'electron'
import type { Password, PasswordInput } from '@repo/db'
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
} from './import/types'

export interface AiImportKeyStatus {
  mode: 'development' | 'production'
  hasConfiguredKey: boolean
}

contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<Password[]> => ipcRenderer.invoke('get-passwords'),
  getPasswordById: (id: number): Promise<Password | null> => ipcRenderer.invoke('get-password-by-id', id),
  addPassword: (data: PasswordInput): Promise<Password | null> => ipcRenderer.invoke('add-password', data),
  updatePassword: (id: number, data: PasswordInput): Promise<Password | null> =>
    ipcRenderer.invoke('update-password', id, data),
  deletePassword: (id: number): Promise<boolean> => ipcRenderer.invoke('delete-password', id),
  searchPasswords: (query: string): Promise<Password[]> => ipcRenderer.invoke('search-passwords', query),
  getCategories: (): Promise<string[]> => ipcRenderer.invoke('get-categories'),
  selectImportFiles: (): Promise<ImportFileDescriptor[]> => ipcRenderer.invoke('select-import-files'),
  runImportWorkflow: (files: ImportFileDescriptor[]): Promise<ImportWorkflowResult> =>
    ipcRenderer.invoke('run-import-workflow', files),
  saveImportedPasswords: (candidates: ImportPasswordInput[]): Promise<{ saved: number }> =>
    ipcRenderer.invoke('save-imported-passwords', candidates),
  getAiImportKeyStatus: (): Promise<AiImportKeyStatus> =>
    ipcRenderer.invoke('get-ai-import-key-status'),
  setAiImportKey: (key: string): Promise<AiImportKeyStatus> =>
    ipcRenderer.invoke('set-ai-import-key', key),
  clearAiImportKey: (): Promise<AiImportKeyStatus> =>
    ipcRenderer.invoke('clear-ai-import-key'),
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
      getAiImportKeyStatus: () => Promise<AiImportKeyStatus>
      setAiImportKey: (key: string) => Promise<AiImportKeyStatus>
      clearAiImportKey: () => Promise<AiImportKeyStatus>
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
