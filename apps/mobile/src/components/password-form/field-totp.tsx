import { ShieldCheck } from 'lucide-react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from '@repo/i18n';
import { Input } from '@/components/ui/input';
import { FormType } from './form';

export function FieldTotp() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name="totpSecret"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Input
          value={value}
          onChangeText={onChange}
          label={t('totp.secretLabel')}
          variant="outline"
          icon={ShieldCheck}
          placeholder={t('totp.secretPlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          // The schema stores the i18n key as the message so it can be localised
          // here; fall back to the raw message for non-key validation errors.
          error={error?.message ? t(error.message) : undefined}
        />
      )}
    />
  );
}
