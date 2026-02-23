import { View } from "react-native";
import { usePasswordStore } from "@/store/passwordStore";
import { PasswordItem } from "@/components/password-item";

export function AllPassword() {
  const { passwords } = usePasswordStore()
  return (
    <View className="flex gap-2">
      {
        passwords.map(p => <PasswordItem key={p.id} password={p} />)
      }
    </View>
  )
}