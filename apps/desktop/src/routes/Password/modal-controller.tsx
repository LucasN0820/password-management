import { AddPasswordModal } from "@/components/AddPasswordModal";
import { useStore } from "./context";
import { usePasswordStore } from "@/store/passwordStore";
import { EditPasswordModal } from "@/components/EditPasswordModal";

export function ModalController() {
  const { modal, setModal } = useStore()
  const { addPassword, updatePassword, categories } = usePasswordStore()

  if (!modal) {
    return null
  }

  if (modal.type === 'edit-password') {
    return (
      <EditPasswordModal onClose={() => { setModal(null) }} onSave={(id, data) => {
        updatePassword(id, data)
      }} existingCategories={categories} password={modal.password} />
    )
  }

  return (
    <AddPasswordModal onClose={() => { setModal(null) }} onSave={(data) => {
      addPassword(data)
    }} existingCategories={categories} />
  )
}