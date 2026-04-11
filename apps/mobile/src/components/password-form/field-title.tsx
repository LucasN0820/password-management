import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { BookIcon } from "lucide-react-native";

export function FieldTitle() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="title" label="TITLE" variant="outline" icon={BookIcon} />
}