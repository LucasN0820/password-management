import { app } from 'electron'
import { createHash } from 'crypto'
import { createWriteStream, existsSync } from 'fs'
import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import type { LocalAiImportConfig } from '../settings'

const DEFAULT_MODEL_FILE = 'gemma-4-26B-A4B-it-Q4_K_M.gguf'
const MODEL_MANIFEST_FILE = 'manifest.json'

export interface LocalModelStatus {
  path: string
  exists: boolean
  repo: string
  quant: string
  fileName: string
  sha256?: string
  downloadedAt?: string
}

interface LocalModelManifest {
  repo: string
  quant: string
  fileName: string
  path: string
  sizeBytes: number
  sha256: string
  downloadedAt: string
}

function getModelsDir() {
  return join(app.getPath('userData'), 'models')
}

function getModelFileName(config: LocalAiImportConfig) {
  return config.modelFile ?? DEFAULT_MODEL_FILE
}

function getManifestPath() {
  return join(getModelsDir(), MODEL_MANIFEST_FILE)
}

async function readManifest() {
  try {
    return JSON.parse(
      await readFile(getManifestPath(), 'utf8'),
    ) as LocalModelManifest
  } catch {
    return null
  }
}

function buildHuggingFaceDownloadUrl(config: LocalAiImportConfig) {
  const fileName = encodeURIComponent(getModelFileName(config))
  return `https://huggingface.co/${config.modelRepo}/resolve/main/${fileName}?download=true`
}

export function resolveLocalModelPath(config: LocalAiImportConfig) {
  return config.modelPath ?? join(getModelsDir(), getModelFileName(config))
}

export async function getLocalModelStatus(
  config: LocalAiImportConfig,
): Promise<LocalModelStatus> {
  const modelPath = resolveLocalModelPath(config)
  const manifest = await readManifest()

  return {
    path: modelPath,
    exists: existsSync(modelPath),
    repo: config.modelRepo,
    quant: config.modelQuant,
    fileName: getModelFileName(config),
    sha256: manifest?.path === modelPath ? manifest.sha256 : undefined,
    downloadedAt:
      manifest?.path === modelPath ? manifest.downloadedAt : undefined,
  }
}

async function downloadFile(
  url: string,
  destinationPath: string,
  expectedSha256?: string,
  signal?: AbortSignal,
) {
  const partialPath = `${destinationPath}.partial`
  const response = await fetch(url, { signal })

  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download local model: HTTP ${response.status}`,
    )
  }

  await rm(partialPath, { force: true }).catch(() => undefined)

  const hash = createHash('sha256')
  const writer = createWriteStream(partialPath)
  const reader = response.body.getReader()
  let sizeBytes = 0

  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error('Local model download was cancelled')
      }

      const { done, value } = await reader.read()
      if (done) break

      const buffer = Buffer.from(value)
      sizeBytes += buffer.length
      hash.update(buffer)
      if (!writer.write(buffer)) {
        await new Promise<void>(resolve => {
          writer.once('drain', () => resolve())
        })
      }
    }

    await new Promise<void>((resolve, reject) => {
      writer.once('error', reject)
      writer.end(() => resolve())
    })

    const sha256 = hash.digest('hex')

    if (
      expectedSha256 &&
      sha256.toLowerCase() !== expectedSha256.toLowerCase()
    ) {
      throw new Error(
        `Downloaded model checksum mismatch. Expected ${expectedSha256}, got ${sha256}.`,
      )
    }

    await rename(partialPath, destinationPath)

    return { sha256, sizeBytes }
  } catch (error) {
    writer.destroy()
    await rm(partialPath, { force: true }).catch(() => undefined)
    throw error
  }
}

export async function ensureLocalModel(
  config: LocalAiImportConfig,
  signal?: AbortSignal,
) {
  const status = await getLocalModelStatus(config)

  if (status.exists) {
    return status.path
  }

  if (config.modelPath) {
    throw new Error(
      [
        'Local AI model not found.',
        `Expected ${status.repo}:${status.quant} at ${status.path}.`,
        'Update AI_IMPORT_MODEL_PATH or download the model before starting AI Import.',
      ].join(' '),
    )
  }

  const modelPath = resolveLocalModelPath(config)
  await mkdir(getModelsDir(), { recursive: true })

  const url = config.modelDownloadUrl ?? buildHuggingFaceDownloadUrl(config)
  const { sha256, sizeBytes } = await downloadFile(
    url,
    modelPath,
    config.modelSha256,
    signal,
  )

  const manifest: LocalModelManifest = {
    repo: config.modelRepo,
    quant: config.modelQuant,
    fileName: getModelFileName(config),
    path: modelPath,
    sizeBytes,
    sha256,
    downloadedAt: new Date().toISOString(),
  }

  await writeFile(getManifestPath(), JSON.stringify(manifest, null, 2), 'utf8')

  return modelPath
}

export async function assertLocalModelExists(config: LocalAiImportConfig) {
  const status = await getLocalModelStatus(config)

  if (!status.exists) {
    throw new Error(
      [
        'Local AI model not found.',
        `Expected ${status.repo}:${status.quant} at ${status.path}.`,
        'Set AI_IMPORT_MODEL_PATH to a local GGUF file or download the model before starting AI Import.',
      ].join(' '),
    )
  }

  return status.path
}
