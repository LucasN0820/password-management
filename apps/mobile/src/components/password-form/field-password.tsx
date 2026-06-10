import { LockIcon } from "lucide-react-native";
import { useFormContext } from "react-hook-form";
import { InputField } from "../form/input-field";
import { FormType } from "./form";

export function FieldPassword() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name='password' label="PASSWORD" variant="outline" icon={LockIcon} />
}