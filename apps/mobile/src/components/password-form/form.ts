import { z } from "zod";
import { useForm, type UseFormProps, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"

export const formSchema = z.object({
  title: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  url: z.string().url(),
  notes: z.string(),
  category: z.string(),
  favorite: z.number()
})

export type FormType = z.infer<typeof formSchema>

export const defaultValues: FormType = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  category: '',
  favorite: 0
}

export function useValidatedForm(args: Omit<UseFormProps<FormType>, "resolver">): UseFormReturn<FormType> {
  return useForm<FormType>({
    resolver: zodResolver(formSchema),
    ...args,
  })
}