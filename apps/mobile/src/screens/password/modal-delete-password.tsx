import { DeleteDialog } from '@/components/delete-dialog';
import { usePasswordStore } from '@/store/passwordStore';
import { useStore, ModalDataDeletePassword } from './context';
import { useMutation } from '@tanstack/react-query';

export function ModalDeletePassword({
  modal,
}: {
  modal: ModalDataDeletePassword;
}) {
  const setModal = useStore(s => s.setModal);
  const { deletePassword } = usePasswordStore();

  const { mutate } = useMutation({
    mutationFn: async () => {
      await deletePassword(modal.id);
    },
    onSuccess: () => {
      setModal(null);
    },
  });

  return (
    <DeleteDialog
      visible
      title={modal.title}
      onClose={() => setModal(null)}
      onConfirm={() => mutate()}
    />
  );
}
