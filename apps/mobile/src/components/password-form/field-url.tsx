import { LinkIcon } from "lucide-react-native";
import { useFormContext } from "react-hook-form";
import { InputField } from "../form/input-field";
import { FormType } from "./form";

export function FieldUrl() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name="url" label="URL" variant="outline" icon={LinkIcon} placeholder="e.g. github.com" />
}