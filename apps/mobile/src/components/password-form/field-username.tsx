import { UserIcon } from 'lucide-react-native';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from '@repo/i18n';
import { InputField } from '../form/input-field';
import { FormType } from './form';

export function FieldUsername() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();

  return (
    <InputField
      control={control}
      name="username"
      label={t('form.username')}
      variant="outline"
      icon={UserIcon}
    />
  );
}
