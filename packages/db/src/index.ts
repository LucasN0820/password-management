export type {
  Password,
  PasswordInput,
  PasswordRow,
  PasswordRowInput,
  DatabaseAdapter,
} from './types'

export {
  passwords,
  schema,
} from './schema'

export type { PasswordDatabase } from './database'
export {
  migratePasswordDatabase,
  getPasswords,
  getPasswordById,
  addPassword,
  updatePassword,
  deletePassword,
  searchPasswords,
  getCategories,
  createDrizzleAdapter,
} from './database'

export type { PasswordState } from './store'
export { createPasswordStore } from './store'

export type { RandomBytesProvider, VaultKeyProvider } from './encryption'
export {
  createEncryptedAdapter,
  createVaultKey,
  decryptSecret,
  encryptSecret,
} from './encryption'
