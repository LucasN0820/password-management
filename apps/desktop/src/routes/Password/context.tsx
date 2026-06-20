import { createContext, useContext } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { Password } from '@/store/passwordStore';

interface ModalAddPassword {
  type: 'add-password';
}

interface ModalEditPassword {
  type: 'edit-password';
  password: Password;
}

type ModalData = ModalAddPassword | ModalEditPassword;

interface State {
  modal: ModalData | null;
  setModal: (modal: ModalData | null) => void;
}

export const passwordPageStore = createStore<State>(set => { return {
  modal: null,
  setModal: modal => {
    set({ modal });
  },
} });

export const PasswordStoreContext = createContext<
  typeof passwordPageStore | null
>(null);

export function useStore() {
  const store = useContext(PasswordStoreContext);
  const state = useZustandStore(store ?? passwordPageStore);

  if (!store) {
    throw new Error('useStore must be used within a PasswordStoreProvider');
  }

  return state;
}
