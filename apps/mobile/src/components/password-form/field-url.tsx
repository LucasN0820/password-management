import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { LinkIcon } from "lucide-react-native";

export function FieldUrl() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="url" label="网址" variant="outline" icon={LinkIcon} />
}