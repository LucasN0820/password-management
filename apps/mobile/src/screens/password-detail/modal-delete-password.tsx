import { ModalDeletePassword as ModalDeletePasswordComponent } from '@/components/modal-delete-password';
import { useStore, ModalDataDeletePassword } from './context';

export function ModalDeletePassword({
  modal,
}: {
  modal: ModalDataDeletePassword;
}) {
  const setModal = useStore(s => s.setModal);
  return (
    <ModalDeletePasswordComponent
      onClose={() => {
        setModal(null);
      }}
      id={modal.id}
      title={modal.title}
    />
  );
}
