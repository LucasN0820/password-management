// Load env files and materialize packaged runtime config before electron-builder.
const {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} = require('fs')
const { extname, join, resolve } = require('path')

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf8')
  const vars = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const sep = trimmed.indexOf('=')
    if (sep === -1) continue
    const key = trimmed.slice(0, sep).trim()
    let val = trimmed.slice(sep + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    vars[key] = val
  }
  return vars
}

const appDir = process.cwd()
const rootDir = resolve(appDir, '../..')
const env = {
  ...parseEnvFile(resolve(rootDir, '.env')),
  ...parseEnvFile(resolve(rootDir, '.env.local')),
  ...parseEnvFile(resolve(appDir, '.env')),
  ...parseEnvFile(resolve(appDir, '.env.local')),
  ...process.env,
}

// Inject into process.env for electron-builder to pick up
for (const [key, val] of Object.entries(env)) {
  if (key.startsWith('AI_IMPORT_')) {
    process.env[key] = val
  }
}

mkdirSync(resolve(appDir, 'build'), { recursive: true })
writeFileSync(
  resolve(appDir, 'build/desktop-env.json'),
  JSON.stringify(
    {
      AI_IMPORT_PROVIDER: env.AI_IMPORT_PROVIDER ?? 'local-llama',
      AI_IMPORT_MODEL_REPO:
        env.AI_IMPORT_MODEL_REPO ?? 'ggml-org/gemma-4-26B-A4B-it-GGUF',
      AI_IMPORT_MODEL_QUANT: env.AI_IMPORT_MODEL_QUANT ?? 'Q4_K_M',
      AI_IMPORT_MODEL_FILE:
        env.AI_IMPORT_MODEL_FILE ?? 'gemma-4-26B-A4B-it-Q4_K_M.gguf',
      AI_IMPORT_MODEL_SHA256: env.AI_IMPORT_MODEL_SHA256 ?? '',
      AI_IMPORT_MODEL_DOWNLOAD_URL: env.AI_IMPORT_MODEL_DOWNLOAD_URL ?? '',
      AI_IMPORT_MODEL_PATH: env.AI_IMPORT_MODEL_PATH ?? '',
      AI_IMPORT_LLAMA_SERVER_PATH: env.AI_IMPORT_LLAMA_SERVER_PATH ?? '',
      AI_IMPORT_CONTEXT_SIZE: env.AI_IMPORT_CONTEXT_SIZE ?? '8192',
      AI_IMPORT_MAX_TOKENS: env.AI_IMPORT_MAX_TOKENS ?? '2000',
      AI_IMPORT_KEEP_SERVER_ALIVE_MS:
        env.AI_IMPORT_KEEP_SERVER_ALIVE_MS ?? '300000',
      AI_IMPORT_SERVICE_URL: env.AI_IMPORT_SERVICE_URL ?? '',
      AI_IMPORT_SERVICE_SECRET: env.AI_IMPORT_SERVICE_SECRET ?? '',
    },
    null,
    2
  ),
  'utf8'
)

function ensureRuntimeExecutableBits(runtimeDir) {
  if (process.platform === 'win32' || !existsSync(runtimeDir)) return

  for (const entry of readdirSync(runtimeDir)) {
    const filePath = join(runtimeDir, entry)
    const stats = statSync(filePath)
    if (stats.isDirectory()) {
      ensureRuntimeExecutableBits(filePath)
      continue
    }

    const extension = extname(entry)
    if (!extension || extension === '.dylib' || extension === '.so') {
      chmodSync(filePath, 0o755)
    }
  }
}

ensureRuntimeExecutableBits(resolve(appDir, 'bin/llama.cpp'))

// Now run electron-builder with the rest of the arguments
const { spawn } = require('child_process')
const builder = spawn('electron-builder', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
})
builder.on('close', code => {
  process.exit(code ?? 0)
})
