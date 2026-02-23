import { ModalEditPassword as ModalEditPasswordComponent } from "@/components/modal-edit-password"
import { useStore } from "./context"
import { ModalDataEditPassword } from "./context"

export function ModalEditPassword({ modal }: { modal: ModalDataEditPassword }) {
  const setModal = useStore(s => s.setModal)
  return (
    <ModalEditPasswordComponent onClose={() => { setModal(null) }} id={modal.id} />
  )
}