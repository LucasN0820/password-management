import { DeleteDialog } from '@/components/delete-dialog';
import { usePasswordStore } from '@/store/passwordStore';
import { useStore, ModalDataDeletePassword } from './context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function ModalDeletePassword({
  modal,
}: {
  modal: ModalDataDeletePassword;
}) {
  const setModal = useStore(s => s.setModal);
  const { deletePassword } = usePasswordStore();
  const router = useRouter();
  const qc = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async () => {
      await deletePassword(modal.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['findPassword'] });
      setModal(null);
      router.back();
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
