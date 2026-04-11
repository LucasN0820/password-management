import type { JSX } from 'react'
import { useStore } from './context'
import { ModalUserAdd } from './modal-user-add'
import { ModalUserDelete } from './modal-user-delete'
import { ModalUserEdit } from './modal-user-edit'

export function ModalController(): JSX.Element | undefined {
  const modalData = useStore(s => s.modalData)

  if (!modalData) {
    return undefined
  }

  switch (modalData.type) {
    case 'add-user': {
      return <ModalUserAdd />
    }

    case 'edit-user': {
      return <ModalUserEdit data={modalData} />
    }

    case 'delete-user': {
      return <ModalUserDelete data={modalData} />
    }
  }
}
