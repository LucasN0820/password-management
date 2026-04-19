export interface ImportFileDescriptor {
  path: string
  name: string
  size: number
  extension: string
}

export interface ImportCandidateDraft {
  id: string
  sourceFile: string
  title: string
  username: string
  password: string
  url: string | null
  notes: string | null
  confidence: number
  sourceExcerpt: string
}

export interface ImportFileResult {
  fileName: string
  extension: string
  status: 'processed' | 'failed'
  candidateCount: number
  warning?: string
}

export interface ImportWorkflowResult {
  files: ImportFileResult[]
  candidates: ImportCandidateDraft[]
  warnings: string[]
}

export interface ImportPasswordInput {
  title: string
  username: string
  password: string
  url: string | null
  notes: string | null
}

export interface ParsedTextFile {
  kind: 'text'
  file: ImportFileDescriptor
  text: string
  excerpts: string[]
  prefilledCandidates: ImportCandidateDraft[]
}

export interface ParsedImageFile {
  kind: 'image'
  file: ImportFileDescriptor
  mimeType: string
  base64: string
}

export type ParsedImportFile = ParsedTextFile | ParsedImageFile
