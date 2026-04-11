import type { JSX } from 'react'
import type { ModalDataDeleteUser } from './context'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@repo/ui/primitives/button'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useStore } from './context'

export function ModalUserDelete({ data }: { data: ModalDataDeleteUser }): JSX.Element {
  // Open upon mounting
  const [open, setOpen] = useState(true)
  const setModalData = useStore(s => s.setModalData)

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      // mock the mutation
      await Promise.resolve({ userId })
    },
    onSuccess() {
      // close the modal on success
      setOpen(false)
    },
  })

  return (
    // The modal renders as an alert dialog.
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent onAnimationEndCapture={() => {
        if (!open) {
          // Unmount once closed.
          setModalData(undefined)
        }
      }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user</AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <LoadingButton
            isLoading={isPending}
            className="w-full"
            onClick={() => {
              // Submit the form
              mutate({ userId: data.userId })
            }}
          >
            Delete
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
