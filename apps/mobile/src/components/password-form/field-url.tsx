import { LinkIcon } from 'lucide-react-native';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from '@repo/i18n';
import { InputField } from '../form/input-field';
import { FormType } from './form';

export function FieldUrl() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();

  return (
    <InputField
      control={control}
      name="url"
      label={t('form.url')}
      variant="outline"
      icon={LinkIcon}
      placeholder={t('form.urlPlaceholder')}
    />
  );
}
