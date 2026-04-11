'use client'

import type { JSX } from 'react'
import type { User } from './mock-data'
import { Button } from '@repo/ui/primitives/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/primitives/dropdown-menu'
import { EllipsisIcon } from 'lucide-react'
import { useStore } from './context'

interface Props {
  user: User
}

export function ButtonUserMenu({ user }: Props): JSX.Element {
  const setModalData = useStore(s => s.setModalData)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setModalData({ type: 'edit-user', user })}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setModalData({ type: 'delete-user', userId: user.id })} variant="destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
