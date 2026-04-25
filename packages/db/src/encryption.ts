import { gcm } from '@noble/ciphers/aes.js'
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js'
import type { DatabaseAdapter, Password, PasswordInput } from './types'

const ENCRYPTION_VERSION = 1
const ALGORITHM = 'AES-256-GCM'
const KEY_BYTES = 32
const NONCE_BYTES = 12

export type VaultKeyProvider = () => Promise<string>
export type RandomBytesProvider = (length: number) => Uint8Array | Promise<Uint8Array>

interface EncryptedSecretEnvelope {
  v: typeof ENCRYPTION_VERSION
  alg: typeof ALGORITHM
  nonce: string
  data: string
}

function parseVaultKey(vaultKey: string) {
  const key = hexToBytes(vaultKey)
  if (key.length !== KEY_BYTES) {
    throw new Error(`Vault key must be ${KEY_BYTES} bytes`)
  }
  return key
}

function parseEncryptedSecret(value: string): EncryptedSecretEnvelope {
  const parsed = JSON.parse(value) as Partial<EncryptedSecretEnvelope>
  if (
    parsed.v !== ENCRYPTION_VERSION ||
    parsed.alg !== ALGORITHM ||
    typeof parsed.nonce !== 'string' ||
    typeof parsed.data !== 'string'
  ) {
    throw new Error('Invalid encrypted secret payload')
  }

  return parsed as EncryptedSecretEnvelope
}

export function createVaultKey(randomBytes: RandomBytesProvider = length => crypto.getRandomValues(new Uint8Array(length))) {
  const bytes = randomBytes(KEY_BYTES)
  if (bytes instanceof Promise) {
    return bytes.then(bytesToHex)
  }
  return bytesToHex(bytes)
}

export async function encryptSecret(
  value: string,
  vaultKey: string,
  randomBytes: RandomBytesProvider = length => crypto.getRandomValues(new Uint8Array(length)),
) {
  const nonce = await randomBytes(NONCE_BYTES)
  const cipher = gcm(parseVaultKey(vaultKey), nonce)
  const ciphertext = cipher.encrypt(utf8ToBytes(value))

  return JSON.stringify({
    v: ENCRYPTION_VERSION,
    alg: ALGORITHM,
    nonce: bytesToHex(nonce),
    data: bytesToHex(ciphertext),
  } satisfies EncryptedSecretEnvelope)
}

export function decryptSecret(value: string, vaultKey: string) {
  const envelope = parseEncryptedSecret(value)
  const cipher = gcm(parseVaultKey(vaultKey), hexToBytes(envelope.nonce))
  const plaintext = cipher.decrypt(hexToBytes(envelope.data))
  return bytesToUtf8(plaintext)
}

async function encryptPasswordInput(
  data: PasswordInput,
  vaultKey: string,
  randomBytes: RandomBytesProvider,
): Promise<PasswordInput> {
  return {
    ...data,
    password: await encryptSecret(data.password, vaultKey, randomBytes),
    notes: data.notes ? await encryptSecret(data.notes, vaultKey, randomBytes) : null,
  }
}

function decryptPassword(password: Password, vaultKey: string): Password {
  return {
    ...password,
    password: decryptSecret(password.password, vaultKey),
    notes: password.notes ? decryptSecret(password.notes, vaultKey) : null,
  }
}

export function createEncryptedAdapter(
  baseAdapter: DatabaseAdapter,
  getVaultKey: VaultKeyProvider,
  randomBytes: RandomBytesProvider,
): DatabaseAdapter {
  return {
    getPasswords: async () => {
      const vaultKey = await getVaultKey()
      const passwords = await baseAdapter.getPasswords()
      return passwords.map(password => decryptPassword(password, vaultKey))
    },
    getPasswordById: async id => {
      const vaultKey = await getVaultKey()
      const password = await baseAdapter.getPasswordById(id)
      return password ? decryptPassword(password, vaultKey) : null
    },
    addPassword: async data => {
      const vaultKey = await getVaultKey()
      await baseAdapter.addPassword(
        await encryptPasswordInput(data, vaultKey, randomBytes),
      )
    },
    updatePassword: async (id, data) => {
      const vaultKey = await getVaultKey()
      await baseAdapter.updatePassword(
        id,
        await encryptPasswordInput(data, vaultKey, randomBytes),
      )
    },
    deletePassword: id => baseAdapter.deletePassword(id),
    searchPasswords: async query => {
      const normalizedQuery = query.trim().toLowerCase()
      if (!normalizedQuery) {
        return []
      }

      const vaultKey = await getVaultKey()
      const passwords = (await baseAdapter.getPasswords()).map(password =>
        decryptPassword(password, vaultKey),
      )

      return passwords.filter(password =>
        [
          password.title,
          password.username,
          password.url ?? '',
          password.notes ?? '',
          password.category,
        ].some(value => value.toLowerCase().includes(normalizedQuery)),
      )
    },
    getCategories: () => baseAdapter.getCategories(),
  }
}
