import { UseBoundStore, StoreApi } from 'zustand';
import { createContext, useContext } from 'react';
import {
  createDrizzleAdapter,
  createEncryptedAdapter,
  createPasswordStore,
  type Password,
  type PasswordInput,
  type PasswordState,
  type PasswordDatabase,
} from '@repo/db';
import { getMobileRandomBytes, getOrCreateMobileVaultKey } from './vaultKey';

export type { Password, PasswordInput, PasswordState };

export const PasswordContext = createContext<
  UseBoundStore<StoreApi<PasswordState>>
>(undefined!);

export function createStore(db: PasswordDatabase) {
  const adapter = createEncryptedAdapter(
    createDrizzleAdapter(db),
    getOrCreateMobileVaultKey,
    getMobileRandomBytes,
  );
  return createPasswordStore(adapter);
}

export function usePasswordStore() {
  const context = useContext(PasswordContext);

  if (!context) {
    throw new Error('usePasswordStore must be used within PasswordProvider');
  }

  return context();
}
