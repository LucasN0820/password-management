import type { PasswordInput } from '@repo/db';
import { useTranslation } from '@repo/i18n';
import { EMPTY_PASSWORD_FORM_VALUES, PasswordForm } from './PasswordForm';

interface AddPasswordModalProps {
  onClose: () => void;
  onSave: (data: PasswordInput) => void | Promise<void>;
}

export function AddPasswordModal({ onClose, onSave }: AddPasswordModalProps) {
  const { t } = useTranslation();

  return (
    <PasswordForm
      heading={t('modal.addPassword')}
      submitLabel={t('modal.create')}
      uploadLabel={t('form.uploadIcon')}
      initialValues={EMPTY_PASSWORD_FORM_VALUES}
      onClose={onClose}
      onSubmit={onSave}
    />
  );
}
