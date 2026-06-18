import { VoteIcon } from 'lucide-react-native';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from '@repo/i18n';
import { InputField } from '../form/input-field';
import { FormType } from './form';

export function FieldNotes() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();

  return (
    <InputField
      control={control}
      name="notes"
      label={t('form.notes')}
      variant="outline"
      icon={VoteIcon}
      type="textarea"
      placeholder={t('form.notesPlaceholder')}
    />
  );
}
