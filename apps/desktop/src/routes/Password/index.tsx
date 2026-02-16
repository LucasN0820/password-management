import { PasswordList } from "./list"
import { PasswordDetail } from "./detail"
import { createStore, PasswordStoreContext } from "./context"
import { useMemo } from "react"
import { ModalController } from "./modal-controller"

export default function PasswordPage() {
  const store = useMemo(() => createStore(), [])

  return (
    <PasswordStoreContext.Provider value={store}>
      <div className="flex flex-row h-full bg-background">
        <div className="w-80 h-full bg-background border-r border-border/50">
          <PasswordList />
        </div>
        <div className="flex-1">
          <PasswordDetail />
        </div>
        <ModalController />
      </div>
    </PasswordStoreContext.Provider>
  )
}