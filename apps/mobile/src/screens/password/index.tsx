import { useMemo } from "react"
import { createStore, StoreContext } from "./context"
import { Render } from "./render"

export function PasswordScreen() {
  const store = useMemo(() => createStore(), [])
  return (
    <StoreContext.Provider value={store}>
      <Render />
    </StoreContext.Provider>
  )
}


