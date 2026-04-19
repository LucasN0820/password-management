import { existsSync, readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { app } from 'electron'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envCache = new Map<string, string>()

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf8')
  const result: Record<string, string> = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

function getCandidateEnvPaths() {
  return [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
    resolve(app.getAppPath(), '.env.local'),
    resolve(app.getAppPath(), '.env'),
    resolve(app.getAppPath(), '../../.env.local'),
    resolve(app.getAppPath(), '../../.env'),
    join(__dirname, '../../../../.env.local'),
    join(__dirname, '../../../../.env'),
  ]
}

export function getEnvValue(key: string): string | undefined {
  const cachedValue = envCache.get(key)
  if (cachedValue) {
    return cachedValue
  }

  const fromProcess = process.env[key]
  if (fromProcess) {
    envCache.set(key, fromProcess)
    return fromProcess
  }

  for (const filePath of getCandidateEnvPaths()) {
    if (!existsSync(filePath)) continue
    const parsed = parseEnvFile(filePath)
    const value = parsed[key]
    if (value) {
      envCache.set(key, value)
      return value
    }
  }

  return undefined
}
