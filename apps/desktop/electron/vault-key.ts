import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, safeStorage } from 'electron'

const vaultKeyFileName = 'vault-key.json'

interface StoredVaultKey {
  vaultKey: string
  encrypted: boolean
}

function getVaultKeyPath() {
  return join(app.getPath('userData'), vaultKeyFileName)
}

function readStoredVaultKey(): StoredVaultKey | null {
  const path = getVaultKeyPath()
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, 'utf8')) as StoredVaultKey
}

function writeStoredVaultKey(settings: StoredVaultKey) {
  const path = getVaultKeyPath()
  const directory = dirname(path)
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }

  writeFileSync(path, JSON.stringify(settings, null, 2), 'utf8')
}

function createDesktopVaultKey() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is unavailable on this system')
  }

  const vaultKey = randomBytes(32).toString('hex')
  writeStoredVaultKey({
    vaultKey: safeStorage.encryptString(vaultKey).toString('base64'),
    encrypted: true,
  })

  return vaultKey
}

export function getOrCreateDesktopVaultKey() {
  const stored = readStoredVaultKey()
  if (!stored) {
    return createDesktopVaultKey()
  }

  if (!stored.encrypted) {
    throw new Error('Vault key is not stored securely')
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is unavailable on this system')
  }

  return safeStorage.decryptString(Buffer.from(stored.vaultKey, 'base64'))
}
