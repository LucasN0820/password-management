import { create } from 'zustand'
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportWorkflowResult,
} from '../../electron/preload'

export interface EditableImportCandidate extends ImportCandidateDraft {
  selected: boolean
}

type ImportStage = 'idle' | 'processing' | 'review'

interface ImportState {
  stage: ImportStage
  files: ImportFileDescriptor[]
  candidates: EditableImportCandidate[]
  warnings: string[]
  fileResults: ImportWorkflowResult['files']
  error: string | null
  selectFiles: () => Promise<void>
  runImport: () => Promise<boolean>
  updateCandidate: (
    id: string,
    patch: Partial<Pick<EditableImportCandidate, 'title' | 'username' | 'password' | 'url' | 'notes' | 'selected'>>,
  ) => void
  removeCandidate: (id: string) => void
  saveCandidates: () => Promise<number>
  reset: () => void
}

const initialState = {
  stage: 'idle' as ImportStage,
  files: [] as ImportFileDescriptor[],
  candidates: [] as EditableImportCandidate[],
  warnings: [] as string[],
  fileResults: [] as ImportWorkflowResult['files'],
  error: null as string | null,
}

export const useImportStore = create<ImportState>((set, get) => ({
  ...initialState,
  selectFiles: async () => {
    const files = await window.electronAPI.selectImportFiles()
    set({
      files,
      error: files.length ? null : get().error,
    })
  },
  runImport: async () => {
    const files = get().files
    if (!files.length) {
      set({ error: 'Select at least one file before starting import.' })
      return false
    }

    set({
      stage: 'processing',
      error: null,
      warnings: [],
      candidates: [],
      fileResults: [],
    })

    try {
      const result = await window.electronAPI.runImportWorkflow(files)
      set({
        stage: 'review',
        warnings: result.warnings,
        fileResults: result.files,
        candidates: result.candidates.map(candidate => ({
          ...candidate,
          selected: true,
        })),
      })
      return true
    } catch (error) {
      set({
        stage: 'idle',
        error: error instanceof Error ? error.message : 'Import failed',
      })
      return false
    }
  },
  updateCandidate: (id, patch) => {
    set(state => ({
      candidates: state.candidates.map(candidate =>
        candidate.id === id ? { ...candidate, ...patch } : candidate,
      ),
    }))
  },
  removeCandidate: id => {
    set(state => ({
      candidates: state.candidates.filter(candidate => candidate.id !== id),
    }))
  },
  saveCandidates: async () => {
    const candidates = get().candidates.filter(candidate => candidate.selected)
    if (!candidates.length) {
      set({ error: 'Select at least one credential to save.' })
      return 0
    }

    const result = await window.electronAPI.saveImportedPasswords(
      candidates.map(candidate => ({
        title: candidate.title.trim() || 'Imported Credential',
        username: candidate.username.trim(),
        password: candidate.password.trim(),
        url: candidate.url?.trim() || null,
        notes: candidate.notes?.trim() || null,
      })),
    )

    set(initialState)
    return result.saved
  },
  reset: () => {
    set(initialState)
  },
}))
