import { BookIcon } from 'lucide-react-native';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from '@repo/i18n';
import { InputField } from '../form/input-field';
import { FormType } from './form';

export function FieldTitle() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();

  return (
    <InputField
      control={control}
      name="title"
      label={t('form.title')}
      variant="outline"
      icon={BookIcon}
    />
  );
}
