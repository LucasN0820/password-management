import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import { createVaultKey } from '@repo/db'

const VAULT_KEY_STORAGE_KEY = 'password-management.vault-key.v1'

export async function getOrCreateMobileVaultKey() {
  const storedKey = await SecureStore.getItemAsync(VAULT_KEY_STORAGE_KEY)
  if (storedKey) {
    return storedKey
  }

  const vaultKey = await createVaultKey(length => Crypto.getRandomBytesAsync(length))
  await SecureStore.setItemAsync(VAULT_KEY_STORAGE_KEY, vaultKey)
  return vaultKey
}

export function getMobileRandomBytes(length: number) {
  return Crypto.getRandomBytesAsync(length)
}
