import type { JSX } from 'react'
import { Trans } from '@lingui/react/macro'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ButtonUserMenu } from './button-user-menu'
import { users } from './mock-data'

export function TableUsers(): JSX.Element {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Trans>Name</Trans>
          </TableHead>
          <TableHead>
            <Trans>Email</Trans>
          </TableHead>
          <TableHead>
            <Trans>Actions</Trans>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const { id, name, email } = user
          return (
            <TableRow key={id}>
              <TableCell>{name}</TableCell>
              <TableCell>{email}</TableCell>
              <TableCell>
                <ButtonUserMenu user={user} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
