import { QrCode, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { TotpScanner } from '@/components/totp-scanner';
import { Input } from '@/components/ui/input';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
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
        <View style={styles.field}>
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
          <Pressable
            onPress={() => setScannerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('totp.scan')}
            style={[styles.scanButton, { borderColor: c.border }]}
          >
            <QrCode size={16} color={c.foreground} />
            <Text
              style={[
                styles.scanText,
                { color: c.foreground, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('totp.scan')}
            </Text>
          </Pressable>
          <TotpScanner
            visible={scannerVisible}
            onClose={() => setScannerVisible(false)}
            onScanned={secret => {
              onChange(secret);
              setScannerVisible(false);
            }}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  scanButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  scanText: { fontSize: 13 },
});
