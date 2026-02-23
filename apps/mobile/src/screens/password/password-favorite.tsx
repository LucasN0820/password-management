import { Text, View } from "react-native";
import { usePasswordStore } from "@/store/passwordStore";

export function FavoritePassword() {
  const { passwords } = usePasswordStore()
  return (
    <View className="flex gap-2">
      {
        passwords.filter(p => p.favorite).map(p => (
          <Text key={p.id}>{p.title}</Text>
        ))
      }
    </View>
  )
}