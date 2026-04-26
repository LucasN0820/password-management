// Load env files and materialize packaged runtime config before electron-builder.
const { mkdirSync, readFileSync, existsSync, writeFileSync } = require('fs')
const { resolve } = require('path')

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
  if (key.startsWith('AI_IMPORT_SERVICE_')) {
    process.env[key] = val
  }
}

mkdirSync(resolve(appDir, 'build'), { recursive: true })
writeFileSync(
  resolve(appDir, 'build/desktop-env.json'),
  JSON.stringify(
    {
      AI_IMPORT_SERVICE_URL: env.AI_IMPORT_SERVICE_URL ?? '',
      AI_IMPORT_SERVICE_SECRET: env.AI_IMPORT_SERVICE_SECRET ?? '',
    },
    null,
    2
  ),
  'utf8'
)

// Now run electron-builder with the rest of the arguments
const { spawn } = require('child_process')
const builder = spawn('electron-builder', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
})
builder.on('close', code => {
  process.exit(code ?? 0)
})
