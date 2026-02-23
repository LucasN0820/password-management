import { ModalAddPassword as ModalAddPasswordComponent } from "@/components/modal-add-password"
import { useStore } from "./context"

export default function ModalAddPassword() {
  const setModal = useStore(s => s.setModal)

  return (
    <ModalAddPasswordComponent onClose={() => { setModal(null) }} />
  )
}