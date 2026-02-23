import { useStore } from "./context";
import ModalAddPassword from "./modal-add-password";
import { ModalEditPassword } from "./modal-edit-password";

export function ModalController() {
  const modal = useStore(s => s.modal)
  switch (modal?.type) {
    case "add-password": {
      return <ModalAddPassword />
    }
    case "edit-password": {
      return <ModalEditPassword modal={modal} />
    }
    case "delete-password":
    case undefined: {
      return null
    }
  }
}