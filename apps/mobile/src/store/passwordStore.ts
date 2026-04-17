import { UseBoundStore, StoreApi } from 'zustand';
import { createContext, useContext } from 'react';
import {
  createDrizzleAdapter,
  createPasswordStore,
  type Password,
  type PasswordInput,
  type PasswordState,
  type PasswordDatabase,
} from '@repo/db';

export type { Password, PasswordInput, PasswordState };

export const PasswordContext = createContext<
  UseBoundStore<StoreApi<PasswordState>>
>(undefined!);

export function createStore(db: PasswordDatabase) {
  const adapter = createDrizzleAdapter(db);
  return createPasswordStore(adapter);
}

export function usePasswordStore() {
  const context = useContext(PasswordContext);

  if (!context) {
    throw new Error('usePasswordStore must be used within PasswordProvider');
  }

  return context();
}
