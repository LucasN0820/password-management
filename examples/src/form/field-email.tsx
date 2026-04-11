import type { JSX } from 'react'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@repo/ui/primitives/input'
import { Controller } from 'react-hook-form'
import { useFormUser } from './hooks'

export function FieldEmail(): JSX.Element {
  const form = useFormUser()

  return (
    <Controller
      name="email"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Email</FieldLabel>
          <Input {...field} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
