import { Password } from "@/store/passwordStore";
import { View, Text } from "react-native";

export function PasswordItem({ password }: { password: Password }) {
  return (
    <View>
      <Text>Password: {password.title}</Text>
    </View>
  )
}