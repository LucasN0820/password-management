import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { GroupedInputItem } from "../ui/input";

export function FormTitle() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="title" label="标题" inputRender={GroupedInputItem} />
}