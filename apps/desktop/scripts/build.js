// Load .env and .env.local before running electron-builder
const { readFileSync, existsSync } = require('fs')
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

const envDir = process.cwd()
const env = { ...parseEnvFile(resolve(envDir, '.env')), ...parseEnvFile(resolve(envDir, '.env.local')) }

// Inject into process.env for electron-builder to pick up
for (const [key, val] of Object.entries(env)) {
  if (key.startsWith('AI_IMPORT_SERVICE_')) {
    process.env[key] = val
  }
}

// Now run electron-builder with the rest of the arguments
const { spawn } = require('child_process')
const builder = spawn('electron-builder', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
})
builder.on('close', code => {
  process.exit(code ?? 0)
})
