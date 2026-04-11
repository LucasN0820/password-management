'use client'

import type { JSX, ReactNode } from 'react'
import type { FormType } from './schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { defaultValues, formSchema } from './schema'

interface Props {
  readonly children: ReactNode
  readonly initialValues?: Partial<FormType>
}

export function Provider({ children, initialValues }: Props): JSX.Element {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  })
  return <FormProvider {...form}>{children}</FormProvider>
}
