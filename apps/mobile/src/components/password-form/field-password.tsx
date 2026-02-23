import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { LockIcon } from "lucide-react-native";

export function FieldPassword() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name='password' label="密码" variant="outline" icon={LockIcon} />
}