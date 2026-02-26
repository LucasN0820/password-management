import { ModalDeletePassword } from './modal-delete-password';
import { useStore } from './context';
import ModalAddPassword from './modal-add-password';
import { ModalEditPassword } from './modal-edit-password';

export function ModalController() {
  const modal = useStore(s => s.modal);
  switch (modal?.type) {
    case 'add-password': {
      return <ModalAddPassword />;
    }
    case 'edit-password': {
      return <ModalEditPassword modal={modal} />;
    }
    case 'delete-password': {
      return <ModalDeletePassword modal={modal} />;
    }
    case undefined: {
      return null;
    }
  }
}
