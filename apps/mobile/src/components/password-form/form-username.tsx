import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { GroupedInputItem } from "../ui/input";

export function FormUsername() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="username" label="用户名" inputRender={GroupedInputItem} />
}