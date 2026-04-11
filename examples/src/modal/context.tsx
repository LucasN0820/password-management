'use client'

import type { StoreApi, UseBoundStore } from 'zustand'
import type { User } from './mock-data'
import { createContext, use } from 'react'
import { create, useStore as useStore_ } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface ModalDataAddUser {
  type: 'add-user'
}

export interface ModalDataEditUser {
  type: 'edit-user'
  user: User
}

export interface ModalDataDeleteUser {
  type: 'delete-user'
  userId: string
}

type ModalData = ModalDataAddUser | ModalDataEditUser | ModalDataDeleteUser

export interface State {
  modalData: ModalData | undefined
  setModalData: (modalData: ModalData | undefined) => void
}

export function createStore(): UseBoundStore<StoreApi<State>> {
  return create(
    immer<State>((set) => {
      return {
        modalData: undefined,
        setModalData(modalData: ModalData | undefined) {
          set((s) => {
            s.modalData = modalData
          })
        },
      }
    }),
  )
}

export const StoreContext = createContext<ReturnType<typeof createStore>>(undefined!)

export function useStore<U>(selector: (state: State) => U): U {
  const store = use(StoreContext)

  return useStore_(store, selector)
}

export interface Props {
  users: User[]
}

export const PropsContext = createContext<Props>(undefined!)

export function useProps(): Props {
  return use(PropsContext)
}
