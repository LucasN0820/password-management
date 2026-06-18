import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeleteDialog } from '@/components/delete-dialog';
import { useDeleteWithUndo } from '@/features/undo-delete';
import { ModalDataDeletePassword,useStore } from './context';

export function ModalDeletePassword({
  modal,
}: {
  modal: ModalDataDeletePassword;
}) {
  const setModal = useStore(s => s.setModal);
  const deleteWithUndo = useDeleteWithUndo();
  const router = useRouter();
  const qc = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async () => {
      await deleteWithUndo(modal.id);
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
