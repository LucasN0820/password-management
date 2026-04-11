import type { JSX } from 'react'
import type { Props } from './context'
import { useMemo } from 'react'
import { createStore, PropsContext, StoreContext } from './context'
import { ModalController } from './modal-controller'
import { Render } from './render'

export function MyComponent(props: Props): JSX.Element {
  // It is important to wrap `createStore` with `useMemo` to avoid re-creating the store on every render.
  const store = useMemo(() => createStore(), [])

  return (
    <PropsContext value={props}>
      <StoreContext value={store}>
        <Render />
        {/* Mount the modal controller */}
        <ModalController />
      </StoreContext>
    </PropsContext>
  )
}
