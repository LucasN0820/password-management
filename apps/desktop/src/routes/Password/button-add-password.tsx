
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "./context"

export function ButtonAddPassword() {
  const { setModal } = useStore()

  return (
    <Button
      className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 flex items-center gap-2"
      onClick={() => { setModal({ type: 'add-password' }) }}
    >
      <Plus className="h-4 w-4" />
      添加密码
    </Button>
  )
}