import type { JSX } from 'react'
import { ButtonUserAdd } from './button-user-add'
import { TableUsers } from './table-users'

export function Render(): JSX.Element {
  return (
    <div>
      <ButtonUserAdd />
      <TableUsers />
    </div>
  )
}
