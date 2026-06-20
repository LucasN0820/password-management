import { AddPasswordModal } from '@/components/AddPasswordModal';
import { EditPasswordModal } from '@/components/EditPasswordModal';
import { usePasswordStore } from '@/store/passwordStore';
import { useStore } from './context';

export function ModalController() {
  const { modal, setModal } = useStore();
  const { addPassword, updatePassword } = usePasswordStore();

  if (!modal) {
    return null;
  }

  if (modal.type === 'edit-password') {
    return (
      <EditPasswordModal
        password={modal.password}
        onSave={(id, data) => updatePassword(id, data)}
        onClose={() => {
          setModal(null);
        }}
      />
    );
  }

  return (
    <AddPasswordModal
      onSave={data => addPassword(data)}
      onClose={() => {
        setModal(null);
      }}
    />
  );
}
