import { createHash } from 'crypto'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { extractCredentialsFromImageFile, extractCredentialsFromTextFile } from './deepseek'
import { parseImportFile } from './parser'
import type {
  ImportCandidateDraft,
  ImportFileDescriptor,
  ImportFileResult,
  ImportWorkflowResult,
  ParsedImportFile,
} from './types'

const ImportState = Annotation.Root({
  files: Annotation<ImportFileDescriptor[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  parsedFiles: Annotation<ParsedImportFile[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  candidates: Annotation<ImportCandidateDraft[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  fileResults: Annotation<ImportFileResult[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  warnings: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
})

const parseFilesNode = async (state: typeof ImportState.State) => {
  const parsedFiles: ParsedImportFile[] = []
  const fileResults: ImportFileResult[] = []
  const warnings: string[] = []

  for (const file of state.files) {
    try {
      const parsed = await parseImportFile(file)
      parsedFiles.push(parsed)
      fileResults.push({
        fileName: file.name,
        extension: file.extension,
        status: 'processed',
        candidateCount: 0,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown file parse error'
      warnings.push(`${file.name}: ${message}`)
      fileResults.push({
        fileName: file.name,
        extension: file.extension,
        status: 'failed',
        candidateCount: 0,
        warning: message,
      })
    }
  }

  return {
    parsedFiles,
    fileResults,
    warnings,
  }
}

const extractCandidatesNode = async (state: typeof ImportState.State) => {
  const candidates: ImportCandidateDraft[] = []
  const warnings: string[] = []
  const resultMap = new Map(
    state.fileResults.map(result => [result.fileName, result] as const),
  )

  for (const parsedFile of state.parsedFiles) {
    try {
      const extracted =
        parsedFile.kind === 'image'
          ? await extractCredentialsFromImageFile(parsedFile)
          : await extractCredentialsFromTextFile(parsedFile)

      candidates.push(...extracted)
      const result = resultMap.get(parsedFile.file.name)
      if (result) {
        resultMap.set(parsedFile.file.name, {
          ...result,
          candidateCount: extracted.length,
        })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown extraction error'
      warnings.push(`${parsedFile.file.name}: ${message}`)
      const result = resultMap.get(parsedFile.file.name)
      if (result) {
        resultMap.set(parsedFile.file.name, {
          ...result,
          status: 'failed',
          warning: message,
        })
      }
    }
  }

  return {
    candidates,
    fileResults: Array.from(resultMap.values()),
    warnings,
  }
}

const normalizeCandidatesNode = async (state: typeof ImportState.State) => {
  const dedupeMap = new Map<string, ImportCandidateDraft>()

  for (const candidate of state.candidates) {
    const fingerprint = [
      candidate.title.trim().toLowerCase(),
      candidate.username.trim().toLowerCase(),
      candidate.password.trim(),
      candidate.url?.trim().toLowerCase() ?? '',
    ].join('\x00')
    const key = createHash('sha256').update(fingerprint).digest('hex')

    const existing = dedupeMap.get(key)
    if (!existing || existing.confidence < candidate.confidence) {
      dedupeMap.set(key, candidate)
    }
  }

  return {
    candidates: Array.from(dedupeMap.values()).sort(
      (left, right) => right.confidence - left.confidence,
    ),
  }
}

// langgraph workflow
const workflow = new StateGraph(ImportState)
  .addNode('parseFiles', parseFilesNode)
  .addNode('extractCandidates', extractCandidatesNode)
  .addNode('normalizeCandidates', normalizeCandidatesNode)
  .addEdge(START, 'parseFiles')
  .addEdge('parseFiles', 'extractCandidates')
  .addEdge('extractCandidates', 'normalizeCandidates')
  .addEdge('normalizeCandidates', END)
  .compile()

export async function runImportWorkflow(
  files: ImportFileDescriptor[],
): Promise<ImportWorkflowResult> {
  const result = await workflow.invoke({ files })
  return {
    files: result.fileResults,
    candidates: result.candidates,
    warnings: result.warnings,
  }
}
