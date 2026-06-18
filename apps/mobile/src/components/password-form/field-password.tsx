import { LockIcon } from 'lucide-react-native';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from '@repo/i18n';
import { InputField } from '../form/input-field';
import { FormType } from './form';

export function FieldPassword() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();

  return (
    <InputField
      control={control}
      name="password"
      label={t('form.password')}
      variant="outline"
      icon={LockIcon}
    />
  );
}
