import type { JSX } from 'react'
import { Button } from '@repo/ui/primitives/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@repo/ui/primitives/sheet'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useStore } from './context'

export function ModalUserAdd(): JSX.Element {
  // Open upon mounting
  const [open, setOpen] = useState(true)
  const setModalData = useStore(s => s.setModalData)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // mock the mutation
      await Promise.resolve()
    },
    onSuccess() {
      // close the modal on success
      setOpen(false)
    },
  })

  return (
    // The modal renders as a sheet.
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent onAnimationEndCapture={() => {
        if (!open) {
          // Unmount once closed.
          setModalData(undefined)
        }
      }}
      >
        <SheetHeader>
          <SheetTitle>Add user</SheetTitle>
          <SheetDescription />
        </SheetHeader>
        <div className="px-4">
          {/* Add user form omitted */}
        </div>
        <SheetFooter>
          <LoadingButton
            isLoading={isPending}
            className="w-full"
            onClick={() => {
              // Submit the form
              mutate()
            }}
          >
            Create
          </LoadingButton>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
