import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { UserIcon } from "lucide-react-native";

export function FieldUsername() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="username" label="用户名" variant="outline" icon={UserIcon} />
}