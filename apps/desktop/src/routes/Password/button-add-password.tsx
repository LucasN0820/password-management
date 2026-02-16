
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useStore } from "./context"

export function ButtonAddPassword() {
  const { setModal } = useStore()
  return (
    <Button
      onClick={() => { setModal({ type: 'add-password' }) }}
      className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      添加密码
    </Button>
  )
}