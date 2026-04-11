import type { JSX, RefObject } from 'react'
import type { FormType } from './schema'
import { cn } from '@repo/ui/lib/utils'
import { FieldEmail } from './field-email'
import { FieldName } from './field-name'
import { useFormUser } from './hooks'

interface Props {
  readonly className?: string
  readonly formRef?: RefObject<HTMLFormElement | null>
  readonly onSubmit: (form: FormType) => void
}

export function Form({ className, formRef, onSubmit }: Props): JSX.Element {
  const form = useFormUser()

  return (
    <form className={cn('space-y-2', className)} ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldEmail />
      <FieldName />
    </form>
  )
}
