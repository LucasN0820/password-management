import { ModalDeletePassword } from './modal-delete-password';
import { ModalEditPassword } from './modal-edit-password';
import { useStore } from './context';

export function ModalController() {
  const modal = useStore(s => s.modal);
  switch (modal?.type) {
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
