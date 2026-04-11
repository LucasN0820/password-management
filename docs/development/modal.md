# Modal

A modal is anything that overlays the current UI to present some information or request some action. Examples are:

- A [dialog](https://ui.shadcn.com/docs/components/radix/dialog).
- A [sheet](https://ui.shadcn.com/docs/components/radix/sheet).
- A [bottom sheet](https://github.com/gorhom/react-native-bottom-sheet).

## General principles

- Use zustand and [discriminated union](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions) to make sure at most one modal is presented at any time.
- Decouple a modal container and its content. The container may change due to the runtime environment.
  - For example, for desktop we may present the sheet from the right, while on mobile from the bottom.

## File structure

Usually modals are used in a complex component:

```text
my-component/
├── modal-*.tsx           # a single modal
├── modal-controller.tsx  # a centralized place to control the display of modals
├── context.ts            # in the store there will be a field for the presenting modal
└── ...                   # other files of the component
```

## Examples

See `examples/src/modal` for detailed examples and explanations.

## Workflow

- Define some `ModalDataXXX` interfaces in the `context.tsx`.
- Union those `ModalDataXXX`s into a single `ModalData` type, and add the modal status to the state.
  ```ts
  interface State {
    // ...
    modalData: ModalData | undefined;
    setModalData: (modalData: ModalData | undefined) => void;
  }
  ```
- Implement `modal-user-*.tsx` for each modal. The scaffold can usually by copied from an example.
- Implement the `modal-controller.tsx`, and add mount it to `index.tsx`.
