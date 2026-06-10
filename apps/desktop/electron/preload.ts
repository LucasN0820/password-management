import { clipboard, contextBridge, ipcRenderer } from 'electron';
import type { Password, PasswordInput } from '@repo/db';
import type {
  LocalModelDownloadProgress,
  LocalModelLibraryStatus,
  LocalModelStatus,
} from './ai-import/model-cache';
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
} from './import/types';

interface InlineInterface { modelId?: string }
contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<Password[]> => ipcRenderer.invoke('get-passwords'),
  getPasswordById: (id: number): Promise<Password | null> =>
    { return ipcRenderer.invoke('get-password-by-id', id) },
  addPassword: (data: PasswordInput): Promise<void> =>
    { return ipcRenderer.invoke('add-password', data) },
  addPasswords: (data: PasswordInput[]): Promise<void> =>
    { return ipcRenderer.invoke('add-passwords', data) },
  updatePassword: (id: number, data: PasswordInput): Promise<void> =>
    { return ipcRenderer.invoke('update-password', id, data) },
  deletePassword: (id: number): Promise<boolean> =>
    { return ipcRenderer.invoke('delete-password', id) },
  searchPasswords: (query: string): Promise<Password[]> =>
    { return ipcRenderer.invoke('search-passwords', query) },
  getCategories: (): Promise<string[]> => ipcRenderer.invoke('get-categories'),
  getLocalImportModelStatus: (): Promise<LocalModelStatus> =>
    { return ipcRenderer.invoke('get-local-import-model-status') },
  getLocalImportModelLibraryStatus: (): Promise<LocalModelLibraryStatus> =>
    { return ipcRenderer.invoke('get-local-import-model-library-status') },
  prepareLocalImportModel: (
    modelId?: string
  ): Promise<LocalModelLibraryStatus> =>
    { return ipcRenderer.invoke('prepare-local-import-model', modelId) },
  cancelLocalImportModelDownload: (): Promise<LocalModelLibraryStatus> =>
    { return ipcRenderer.invoke('cancel-local-import-model-download') },
  getLocalImportModelDownloadProgress:
    (): Promise<LocalModelDownloadProgress | null> =>
      { return ipcRenderer.invoke('get-local-import-model-download-progress') },
  removeLocalImportModel: (modelId: string): Promise<LocalModelLibraryStatus> =>
    { return ipcRenderer.invoke('remove-local-import-model', modelId) },
  onLocalImportModelDownloadProgress: (
    callback: (progress: LocalModelDownloadProgress) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      progress: LocalModelDownloadProgress
    ) => { callback(progress); };
    ipcRenderer.on('local-import-model-download-progress', listener);
    return () => {
      ipcRenderer.removeListener(
        'local-import-model-download-progress',
        listener
      );
    };
  },
  setDefaultLocalImportModel: (
    modelId: string
  ): Promise<LocalModelLibraryStatus> =>
    { return ipcRenderer.invoke('set-default-local-import-model', modelId) },
  openLocalImportModelFolder: (): Promise<void> =>
    { return ipcRenderer.invoke('open-local-import-model-folder') },
  selectImportFiles: (): Promise<ImportFileDescriptor[]> =>
    { return ipcRenderer.invoke('select-import-files') },
  runImportWorkflow: (
    files: ImportFileDescriptor[],
    options?: InlineInterface
  ): Promise<ImportWorkflowResult> =>
    { return ipcRenderer.invoke('run-import-workflow', files, options) },
  cancelImportWorkflow: (): Promise<void> =>
    { return ipcRenderer.invoke('cancel-import-workflow') },
  saveImportedPasswords: (
    candidates: ImportPasswordInput[]
  ): Promise<{ saved: number }> =>
    { return ipcRenderer.invoke('save-imported-passwords', candidates) },
  copyToClipboard: (text: string): Promise<void> => {
    clipboard.writeText(text);

    return Promise.resolve();
  },
});

declare global {
  interface Window {
    electronAPI: {
      getPasswords: () => Promise<Password[]>;
      getPasswordById: (id: number) => Promise<Password | null>;
      addPassword: (data: PasswordInput) => Promise<void>;
      addPasswords: (data: PasswordInput[]) => Promise<void>;
      updatePassword: (id: number, data: PasswordInput) => Promise<void>;
      deletePassword: (id: number) => Promise<boolean>;
      searchPasswords: (query: string) => Promise<Password[]>;
      getCategories: () => Promise<string[]>;
      getLocalImportModelStatus: () => Promise<LocalModelStatus>;
      getLocalImportModelLibraryStatus: () => Promise<LocalModelLibraryStatus>;
      prepareLocalImportModel: (
        modelId?: string
      ) => Promise<LocalModelLibraryStatus>;
      cancelLocalImportModelDownload: () => Promise<LocalModelLibraryStatus>;
      getLocalImportModelDownloadProgress: () => Promise<LocalModelDownloadProgress | null>;
      removeLocalImportModel: (
        modelId: string
      ) => Promise<LocalModelLibraryStatus>;
      onLocalImportModelDownloadProgress: (
        callback: (progress: LocalModelDownloadProgress) => void
      ) => () => void;
      setDefaultLocalImportModel: (
        modelId: string
      ) => Promise<LocalModelLibraryStatus>;
      openLocalImportModelFolder: () => Promise<void>;
      selectImportFiles: () => Promise<ImportFileDescriptor[]>;
      runImportWorkflow: (
        files: ImportFileDescriptor[],
        options?: { modelId?: string }
      ) => Promise<ImportWorkflowResult>;
      cancelImportWorkflow: () => Promise<void>;
      saveImportedPasswords: (
        candidates: ImportPasswordInput[]
      ) => Promise<{ saved: number }>;
      copyToClipboard: (text: string) => Promise<void>;
    };
  }
}

export type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
};
export type {
  LocalModelDownloadProgress,
  LocalModelLibraryStatus,
  LocalModelStatus,
};
