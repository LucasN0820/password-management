import type { Password, PasswordInput } from '@repo/db';
import { useTranslation } from '@repo/i18n';
import { PasswordForm } from './PasswordForm';

interface EditPasswordModalProps {
  password: Password;
  onClose: () => void;
  onSave: (id: number, data: PasswordInput) => void | Promise<void>;
}

export function EditPasswordModal({
  password,
  onClose,
  onSave,
}: EditPasswordModalProps) {
  const { t } = useTranslation();
  const initialValues: PasswordInput = {
    title: password.title,
    username: password.username,
    password: password.password,
    url: password.url,
    notes: password.notes,
    category: password.category,
    isFavorite: password.isFavorite,
    icon: password.icon,
    totp_secret: password.totp_secret,
  };

  return (
    <PasswordForm
      heading={t('modal.editPassword')}
      submitLabel={t('modal.save')}
      uploadLabel={t('form.changeIcon')}
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={data => onSave(password.id, data)}
    />
  );
}
