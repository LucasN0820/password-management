import { z } from "zod";
import { useForm, type UseFormProps, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"

export const formSchema = z.object({
  title: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  url: z.string().url().min(1).optional(),
  notes: z.string().min(1).optional(),
  icon: z.string().min(1).optional(), // base 64 string
  category: z.string().min(1).default('all'),
  favorite: z.number().default(0) // 0 - no favorite, 1 - favorite
})

export type FormType = z.infer<typeof formSchema>

export const defaultValues: FormType = {
  title: '',
  username: '',
  password: '',
  url: undefined,
  notes: undefined,
  icon: undefined,
  category: 'all',
  favorite: 0,
}

export function useValidatedForm(args: Omit<UseFormProps<FormType>, "resolver">): UseFormReturn<FormType> {
  return useForm<FormType>({
    resolver: zodResolver(formSchema),
    ...args,
  })
}