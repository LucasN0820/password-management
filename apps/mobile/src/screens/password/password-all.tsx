import { View } from "react-native";
import { usePasswordStore } from "@/store/passwordStore";
import { PasswordItem } from "@/components/password-item";
import { useStore } from "./context";

export function AllPassword() {
  const { passwords } = usePasswordStore()
  const setModal = useStore(s => s.setModal)

  return (
    <View className="flex gap-1">
      {
        passwords.map(p => <PasswordItem key={p.id} password={p} onEdit={(id) => {
          setModal({
            type: 'edit-password',
            id,
          })
        }} />)
      }
    </View>
  )
}