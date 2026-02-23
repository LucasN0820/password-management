import { useFormContext } from "react-hook-form";
import { FormType } from "./form";
import { InputField } from "../form/input-field";
import { VoteIcon } from "lucide-react-native";

export function FieldNotes() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name='notes' label="备注" variant="outline" icon={VoteIcon} type="textarea" />
}