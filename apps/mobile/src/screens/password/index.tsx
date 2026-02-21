import { useMemo } from "react"
import { Render } from "./render"
import { createStore, StoreContext } from "./context"

export function PasswordScreen() {
  const store = useMemo(() => createStore(), [])
  return (
    <StoreContext.Provider value={store}>
      <Render />
    </StoreContext.Provider>
  )
}


