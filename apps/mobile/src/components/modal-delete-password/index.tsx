import { AlertDialog, useAlertDialog } from '@/components/ui/alert-dialog';
import { useCallback } from 'react';

interface Props {
  id: number;
  title: string;
  onClose: () => void;
}

export function ModalDeletePassword({ id, title, onClose }: Props) {
  const { close, isVisible } = useAlertDialog(true);

  const handleClose = useCallback(() => {
    onClose();
    close();
  }, [onClose, close]);

  return (
    <AlertDialog
      isVisible={isVisible}
      onClose={handleClose}
      onCancel={handleClose}
      onConfirm={() => {
        console.debug('deletePassword', id);
      }}
      title="删除密码"
      description={`确定要删除 "${title}" 吗？此操作无法撤销。`}
      confirmText="Delete"
      cancelText="Cancel"
    />
  );
}
