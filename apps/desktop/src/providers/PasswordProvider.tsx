import { useEffect } from "react"
import { usePasswordStore } from "../store/passwordStore"

export function PasswordProvider({ children }: { children: React.ReactNode }) {
  const { loadPasswords, loadCategories } = usePasswordStore()

  useEffect(() => {
    loadPasswords()
    loadCategories()
  }, [loadPasswords, loadCategories])

  return <>{children}</>
}