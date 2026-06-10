import { BookIcon } from "lucide-react-native";
import { useFormContext } from "react-hook-form";
import { InputField } from "../form/input-field";
import { FormType } from "./form";

export function FieldTitle() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="title" label="TITLE" variant="outline" icon={BookIcon} />
}