import { AddPasswordModal } from "@/components/AddPasswordModal";
import { EditPasswordModal } from "@/components/EditPasswordModal";
import { usePasswordStore } from "@/store/passwordStore";
import { useStore } from "./context";

export function ModalController() {
  const { modal, setModal } = useStore()
  const { addPassword, updatePassword, categories } = usePasswordStore()

  if (!modal) {
    return null
  }

  if (modal.type === 'edit-password') {
    return (
      <EditPasswordModal existingCategories={categories} password={modal.password} onClose={() => { setModal(null) }} onSave={(id, data) => {
        updatePassword(id, data)
      }} />
    )
  }

  return (
    <AddPasswordModal existingCategories={categories} onClose={() => { setModal(null) }} onSave={(data) => {
      addPassword(data)
    }} />
  )
}