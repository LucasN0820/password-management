import { createContext, useContext } from 'react';
import {
  create,
  type StoreApi,
  type UseBoundStore,
  useStore as useStore_,
} from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ModalDataEditPassword {
  type: 'edit-password';
  id: number;
}

export interface ModalDataDeletePassword {
  type: 'delete-password';
  id: number;
  title: string;
}

type ModalData = ModalDataEditPassword | ModalDataDeletePassword;

export interface State {
  modal: ModalData | null;
  setModal: (modal: ModalData | null) => void;
}

export function createStore(): UseBoundStore<StoreApi<State>> {
  return create(
    immer<State>(set => {
      return {
        modal: null,
        setModal: (modal: ModalData | null) => {
          set(s => {
            s.modal = modal;
          });
        },
      };
    })
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const StoreContext = createContext<ReturnType<typeof createStore>>(
  undefined!
);

export function useStore<U>(selector: (state: State) => U): U {
  const store = useContext(StoreContext);

  return useStore_(store, selector);
}
