import { contextBridge, ipcRenderer } from 'electron';
import type { Password, PasswordInput } from '@repo/db';
import type {
  LocalModelDownloadProgress,
  LocalModelLibraryStatus,
  LocalModelStatus,
} from './ai-import/model-cache';
import type { AutoUpdateStatus } from './auto-updater';
import { copyToClipboard } from './clipboard';
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportPasswordInput,
  ImportWorkflowResult,
} from './import/types';

interface InlineInterface {
  modelId?: string;
}

type IpcErrorCode = 'VALIDATION_ERROR' | 'DB_ERROR';

function isIpcErrorResult(
  value: unknown
): value is { success: false; code: IpcErrorCode } {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const result = value as { success?: unknown; code?: unknown };
  return (
    result.success === false &&
    (result.code === 'VALIDATION_ERROR' || result.code === 'DB_ERROR')
  );
}

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result: unknown = await ipcRenderer.invoke(channel, ...args);
  if (isIpcErrorResult(result)) {
    const error = new Error(
      result.code === 'VALIDATION_ERROR'
        ? 'Invalid request.'
        : 'Request failed.'
    );
    error.name = 'IpcRequestError';
    Object.assign(error, { code: result.code });
    throw error;
  }
  return result as T;
}

interface ClipboardCopyOptions {
  clearAfterMs?: number;
}
contextBridge.exposeInMainWorld('electronAPI', {
  getPasswords: (): Promise<Password[]> => invoke('get-passwords'),
  getPasswordById: (id: number): Promise<Password | null> => {
    return invoke('get-password-by-id', id);
  },
  addPassword: (data: PasswordInput): Promise<void> =>
    invoke('add-password', data),
  addPasswords: (data: PasswordInput[]): Promise<void> =>
    invoke('add-passwords', data),
  updatePassword: (id: number, data: PasswordInput): Promise<void> => {
    return invoke('update-password', id, data);
  },
  deletePassword: (id: number): Promise<boolean> =>
    invoke('delete-password', id),
  searchPasswords: (query: string): Promise<Password[]> => {
    return invoke('search-passwords', query);
  },
  getCategories: (): Promise<string[]> => invoke('get-categories'),
  getLocalImportModelStatus: (): Promise<LocalModelStatus> => {
    return invoke('get-local-import-model-status');
  },
  getLocalImportModelLibraryStatus: (): Promise<LocalModelLibraryStatus> => {
    return invoke('get-local-import-model-library-status');
  },
  prepareLocalImportModel: (
    modelId?: string
  ): Promise<LocalModelLibraryStatus> => {
    return invoke('prepare-local-import-model', modelId);
  },
  cancelLocalImportModelDownload: (): Promise<LocalModelLibraryStatus> => {
    return invoke('cancel-local-import-model-download');
  },
  getLocalImportModelDownloadProgress:
    (): Promise<LocalModelDownloadProgress | null> => {
      return invoke('get-local-import-model-download-progress');
    },
  removeLocalImportModel: (
    modelId: string
  ): Promise<LocalModelLibraryStatus> => {
    return invoke('remove-local-import-model', modelId);
  },
  onLocalImportModelDownloadProgress: (
    callback: (progress: LocalModelDownloadProgress) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      progress: LocalModelDownloadProgress
    ) => {
      callback(progress);
    };
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
  ): Promise<LocalModelLibraryStatus> => {
    return invoke('set-default-local-import-model', modelId);
  },
  openLocalImportModelFolder: (): Promise<void> => {
    return invoke('open-local-import-model-folder');
  },
  selectImportFiles: (): Promise<ImportFileDescriptor[]> => {
    return invoke('select-import-files');
  },
  runImportWorkflow: (
    files: ImportFileDescriptor[],
    options?: InlineInterface
  ): Promise<ImportWorkflowResult> => {
    return invoke('run-import-workflow', files, options);
  },
  cancelImportWorkflow: (): Promise<void> => invoke('cancel-import-workflow'),
  saveImportedPasswords: (
    candidates: ImportPasswordInput[]
  ): Promise<{ saved: number }> => {
    return invoke('save-imported-passwords', candidates);
  },
  copyToClipboard: (
    text: string,
    options?: ClipboardCopyOptions
  ): Promise<void> => {
    copyToClipboard(text, options?.clearAfterMs);

    return Promise.resolve();
  },
  checkForUpdates: (): Promise<AutoUpdateStatus> =>
    invoke('auto-update:check'),
  downloadUpdate: (): Promise<AutoUpdateStatus> =>
    invoke('auto-update:download'),
  quitAndInstallUpdate: (): Promise<void> =>
    invoke('auto-update:quit-and-install'),
  onAutoUpdateStatus: (callback: (status: AutoUpdateStatus) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      status: AutoUpdateStatus
    ) => {
      callback(status);
    };
    ipcRenderer.on('auto-update-status', listener);
    return () => {
      ipcRenderer.removeListener('auto-update-status', listener);
    };
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
      copyToClipboard: (
        text: string,
        options?: ClipboardCopyOptions
      ) => Promise<void>;
      checkForUpdates: () => Promise<AutoUpdateStatus>;
      downloadUpdate: () => Promise<AutoUpdateStatus>;
      quitAndInstallUpdate: () => Promise<void>;
      onAutoUpdateStatus: (
        callback: (status: AutoUpdateStatus) => void
      ) => () => void;
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
export type { AutoUpdateState,AutoUpdateStatus } from './auto-updater';
