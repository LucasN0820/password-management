# Complex component

## General principles

- Use `zustand` to define a component-wise global store for finer-grained state management.
- Use React Context to share props and prevent prop drilling.
- Separate large components into smaller ones in different files for better maintainability.

## File structure

The recommended file structure for complex components:

```text
my-component/
├── context.tsx    # State definitions, store creation, and context setup
├── index.tsx      # Entry point and context providers
├── render.tsx     # Main rendering logic and sub-component orchestration
└── *.tsx          # Sub-components
```

## Examples

See `examples/src/component` for detailed examples and explanations.

## Workflow

- Start with `context.tsx`. Define `State` and `Props` first.
  - Use `stc` for a quick code snippet.
- Create `index.tsx` and implement the provider wrapping.
  - Use `st` for a quick code snippet.
- Implement `render.tsx` and further sub-components.
