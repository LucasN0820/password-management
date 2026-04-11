# Form

## General principles

- A form component is solely about UI and has nothing to do with submission logic.
- Use React Hook Form and Zod, following [shadcn's doc](https://ui.shadcn.com/docs/forms/react-hook-form).

## File structure

The recommended file structure for a form component:

```text
my-form/
├── field-*.tsx    # a single form field
├── form.tsx       # the final form body
├── hooks.ts       # hooks to manage the form
├── index.ts       # the interface of the component to the outside world
├── provider.tsx   # the provider of the form wrapping the body
└── schema.ts      # the form definition and validation
```

## Examples

See `examples/src/form` for detailed examples and explanations.

## Workflow

- Start with `schema.ts`. Define the schema and validation of your form.
- Add `provider.tsx` and `hooks.ts`. Their codes are quite regular and most of the time only need to copy paste from an example.
- Implement one by one all the `field-*.tsx` according to your schema.
- Finally, add `index.ts` to define exposed things to the outside.
  - Usually only a `Form`, a `FormProvider`, and a `FormType` are exposed.
  - Occasionally, if we want to allow the caller to manage the form, we can expose some hooks.
