import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { GroupedInputItem } from "../ui/input";

export function FormUrl() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="url" label="网址" inputRender={GroupedInputItem} />
}