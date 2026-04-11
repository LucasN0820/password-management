import type { JSX } from 'react'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@repo/ui/primitives/input'
import { Controller } from 'react-hook-form'
import { useFormUser } from './hooks'

export function FieldName(): JSX.Element {
  const form = useFormUser()

  return (
    <Controller
      name="name"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Name</FieldLabel>
          <Input {...field} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
