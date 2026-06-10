import { VoteIcon } from "lucide-react-native";
import { useFormContext } from "react-hook-form";
import { InputField } from "../form/input-field";
import { FormType } from "./form";

export function FieldNotes() {
  const { control } = useFormContext<FormType>()

  return <InputField control={control} name='notes' label="NOTES" variant="outline" icon={VoteIcon} type="textarea" placeholder="Add any notes..." />
}