import { forwardRef, useImperativeHandle } from "react";
import { FormType } from "./form";
import { useValidatedForm } from "./form";
import { FormProvider } from "react-hook-form";
import { GroupedInput } from "@/components/ui/input";
import { FormTitle } from "./form-title";
import { FormPassword } from "./form-password";
import { FormUsername } from "./form-username";
import { FormUrl } from "./form-url";

export interface PasswordFormRef {
  requestSubmit: () => void
}

export * from "./form"

interface PasswordFormProps {
  initialValue?: FormType
  onSubmit?: (data: FormType) => void
}

export const PasswordForm = forwardRef<PasswordFormRef, PasswordFormProps>((props, ref) => {
  const { initialValue, onSubmit } = props

  const form = useValidatedForm({
    defaultValues: initialValue,
    mode: "onChange"
  })

  useImperativeHandle(ref, () => ({
    requestSubmit: () => {
      form.handleSubmit((data) => onSubmit?.(data))()
    }
  }))

  return (
    <FormProvider {...form}>
      <GroupedInput>
        <FormTitle />
        <FormUsername />
        <FormPassword />
        <FormUrl />
      </GroupedInput>
    </FormProvider>
  )
})