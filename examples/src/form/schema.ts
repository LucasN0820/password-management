import z from 'zod'

export const formSchema = z.object({
  email: z.email(),
  name: z.string(),
})

export type FormType = z.infer<typeof formSchema>

export const defaultValues: FormType = {
  email: '',
  name: '',
}
