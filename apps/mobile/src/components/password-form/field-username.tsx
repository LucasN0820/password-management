import { UserIcon } from "lucide-react-native";
import { useFormContext } from "react-hook-form";
import { InputField } from "../form/input-field";
import { FormType } from "./form";

export function FieldUsername() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="username" label="USERNAME" variant="outline" icon={UserIcon} />
}