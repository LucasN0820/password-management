import { ComponentProps, JSX } from "react";
import { ComponentType } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input,InputProps } from "@/components/ui/input";

interface Props<T extends FieldValues> extends ComponentProps<typeof Input> {
  control: UseFormReturn<T>["control"]
  name: Path<T>
  required?: boolean
  inputRender?: ComponentType<InputProps>
}

export function InputField<T extends FieldValues>({
  control,
  name,
  required,
  inputRender: InputRender = Input,
  ...inputProps
}: Props<T>): JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        return (
          <InputRender
            {...inputProps}
            value={value}
            onChangeText={onChange}
            error={error?.message}
          />
        )
      }}
    />
  )
}