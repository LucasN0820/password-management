import { QrCode, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Pressable, useColorScheme } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { TotpScanner } from '@/components/totp-scanner';
import { Input } from '@/components/ui/input';
import { Colors } from '@/theme/colors';
import { FormType } from './form';

export function FieldTotp() {
  const { control } = useFormContext<FormType>();
  const { t } = useTranslation();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const [scannerVisible, setScannerVisible] = useState(false);

  return (
    <Controller
      control={control}
      name="totpSecret"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <>
          <Input
            value={value}
            onChangeText={onChange}
            variant="outline"
            icon={ShieldCheck}
            placeholder={t('totp.secretPlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
            // Validation message is stored as an i18n key; localise it here.
            error={error?.message ? t(error.message) : undefined}
            /**
             * Far-right scan icon opens the camera to read an otpauth:// QR.
             */
            rightComponent={
              <Pressable
                onPress={() => setScannerVisible(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('totp.scan')}
              >
                <QrCode size={20} color={c.mutedForeground} />
              </Pressable>
            }
          />
          <TotpScanner
            visible={scannerVisible}
            onClose={() => setScannerVisible(false)}
            onScanned={secret => {
              onChange(secret);
              setScannerVisible(false);
            }}
          />
        </>
      )}
    />
  );
}
