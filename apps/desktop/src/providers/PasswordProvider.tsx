import { useEffect } from "react"
import { usePasswordStore } from "../store/passwordStore"

interface InlineInterface { children: React.ReactNode }
export function PasswordProvider({ children }: InlineInterface) {
  const { loadPasswords, loadCategories } = usePasswordStore()

  useEffect(() => {
    loadPasswords()
    loadCategories()
  }, [loadPasswords, loadCategories])

  return <>{children}</>
}