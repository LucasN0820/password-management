// @ts-nocheck
'use client'

import type { StoreApi, UseBoundStore } from 'zustand'
import { createContext, use } from 'react'
import { create, useStore as useStore_ } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// State defines dynamic values changeable by interactions.
export interface State {
  value: string
  setValue: (value: string) => void
}

export function createStore(): UseBoundStore<StoreApi<State>> {
  return create(
    immer<State>((set) => {
      return {
        value: '',
        setValue(value: string) {
          set((s) => {
            s.value = value
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

// Props defines static values that are fixed and shared across the component.
export interface Props {
  value: string
}

export const PropsContext = createContext<Props>(undefined!)

export function useProps(): Props {
  return use(PropsContext)
}