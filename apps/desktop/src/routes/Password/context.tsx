import { create } from "zustand"
import { createContext, useContext } from "react"
import { Password } from "@/store/passwordStore"

interface ModalAddPassword {
  type: 'add-password'
}

interface ModalEditPassword {
  type: 'edit-password'
  password: Password
}

type ModalData = ModalAddPassword | ModalEditPassword

interface State {
  modal: ModalData | null
  setModal: (modal: ModalData | null) => void
}

export function createStore() {
  return create<State>((set) => {
    return {
      modal: null,
      setModal: (modal: ModalData | null) => set({ modal })
    }
  })
}

export const PasswordStoreContext = createContext<ReturnType<typeof createStore> | undefined>(undefined)

export function useStore() {
  const store = useContext(PasswordStoreContext)

  if (!store) {
    throw new Error('useStore must be used within a PasswordStoreProvider')
  }

  return store()
}