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

function parseEncryptedSecret(value: string): EncryptedSecretEnvelope | null {
  let parsed: Partial<EncryptedSecretEnvelope>
  try {
    parsed = JSON.parse(value) as Partial<EncryptedSecretEnvelope>
  } catch {
    return null
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    parsed.v !== ENCRYPTION_VERSION ||
    parsed.alg !== ALGORITHM ||
    typeof parsed.nonce !== 'string' ||
    typeof parsed.data !== 'string'
  ) {
    return null
  }

  return parsed as EncryptedSecretEnvelope
}

export function isEncryptedSecret(value: string) {
  return parseEncryptedSecret(value) !== null
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
  if (!envelope) {
    // Legacy record stored before encryption was introduced.
    return value
  }
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

function isLegacyPlaintextPassword(stored: Password) {
  return (
    !isEncryptedSecret(stored.password) ||
    (Boolean(stored.notes) && !isEncryptedSecret(stored.notes as string))
  )
}

function toPasswordInput(password: Password): PasswordInput {
  const { id: _id, created_at: _c, updated_at: _u, ...input } = password
  return input
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
      const decrypted = passwords.map(password =>
        decryptPassword(password, vaultKey),
      )

      // Re-encrypt legacy rows that were stored as plaintext before
      // encryption was introduced.
      await Promise.all(
        passwords.flatMap((stored, index) => {
          if (!isLegacyPlaintextPassword(stored)) return []
          const plain = decrypted[index]
          if (!plain) return []
          return [
            encryptPasswordInput(
              toPasswordInput(plain),
              vaultKey,
              randomBytes,
            ).then(input => baseAdapter.updatePassword(stored.id, input)),
          ]
        }),
      )

      return decrypted
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
