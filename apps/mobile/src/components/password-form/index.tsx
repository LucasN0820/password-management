import { forwardRef, useImperativeHandle } from "react";
import { FormType } from "./form";
import { useValidatedForm } from "./form";
import { FormProvider } from "react-hook-form";
import { View } from "react-native";
import { FieldTitle } from "./field-title";
import { FieldUsername } from "./field-username";
import { FieldPassword } from "./field-password";
import { FieldUrl } from "./field-url";
import { FieldNotes } from "./field-notes";
import { Password } from "@/store/passwordStore";

export interface PasswordFormRef {
  requestSubmit: () => void
}

export * from "./form"

interface PasswordFormProps {
  initialValue?: FormType
  onSubmit?: (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => void
}

export const PasswordForm = forwardRef<PasswordFormRef, PasswordFormProps>((props, ref) => {
  const { initialValue, onSubmit } = props

  const form = useValidatedForm({
    defaultValues: initialValue,
    mode: "onChange"
  })

  useImperativeHandle(ref, () => ({
    requestSubmit: () => {
      form.handleSubmit((data) => {
        onSubmit?.({ ...data, icon: data.icon ?? null, url: data.url ?? null, notes: data.notes ?? null })
      }, (errors) => {
        console.error('validation errors', errors)
      })().catch(console.error)
    }
  }))

  return (
    <FormProvider {...form}>
      <View className="flex gap-4">
        <FieldTitle />
        <FieldUsername />
        <FieldPassword />
        <FieldUrl />
        <FieldNotes />
      </View>
    </FormProvider>
  )
})