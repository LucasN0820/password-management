import { ReactNode, useEffect, useState } from "react";
import { usePasswordStore } from "@/store/passwordStore";
import { Skeleton } from "@/components/ui/skeleton";

export function Monitor({ children }: { children: ReactNode }) {
  const { loadCategories, loadPasswords } = usePasswordStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadCategories(), loadPasswords()]).finally(() => {
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return <Skeleton style={{ height: "100%", width: "100%" }} />
  }

  return <>{children}</>
}