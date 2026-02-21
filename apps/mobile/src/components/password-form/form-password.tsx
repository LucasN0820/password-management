import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { GroupedInputItem } from "../ui/input";

export function FormPassword() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name='password' label="密码" inputRender={GroupedInputItem} />
}