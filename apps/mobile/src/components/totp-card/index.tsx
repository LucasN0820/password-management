import * as Haptics from 'expo-haptics';
import { Copy, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { CircularProgress } from '@/components/circular-progress';
import { copySensitive } from '@/lib/clipboard';
import { generateTotp, isValidBase32Secret } from '@/lib/totp';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

interface TotpCardProps {
  /** Base32 authenticator secret (already decrypted). */
  secret: string;
  scheme: 'light' | 'dark';
  onCopied: (message: string) => void;
}

/** Split a 6-digit code into two groups for readability (e.g. "123 456"). */
function formatCode(code: string) {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}

/**
 * Live TOTP card: regenerates the current code every second, shows a countdown
 * ring, and copies the raw (unspaced) code via the sensitive-clipboard helper.
 */
export function TotpCard({ secret, scheme, onCopied }: TotpCardProps) {
  const { t } = useTranslation();
  const c = Colors[scheme];
  const [now, setNow] = useState(() => Date.now());

  // Re-evaluate once per second; TOTP math is cheap and pure.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totp = useMemo(() => {
    if (!isValidBase32Secret(secret)) {
      return null;
    }
    try {
      return generateTotp(secret, now);
    } catch {
      return null;
    }
  }, [secret, now]);

  if (!totp) {
    return null;
  }

  const progress = totp.secondsRemaining / totp.period;

  const handleCopy = async () => {
    await copySensitive(totp.code);
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onCopied(t('totp.copied'));
  };

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={styles.labelRow}>
        <ShieldCheck size={14} color={c.textTertiary} />
        <Text
          style={[
            styles.labelText,
            { color: c.textTertiary, fontFamily: fonts.bodySemiBold },
          ]}
        >
          {t('totp.label')}
        </Text>
      </View>
      <View style={styles.content}>
        <Text
          selectable
          style={[styles.code, { color: c.foreground, fontFamily: fonts.mono }]}
        >
          {formatCode(totp.code)}
        </Text>
        <View style={styles.actions}>
          <View style={styles.ring}>
            <CircularProgress
              size={28}
              strokeWidth={3}
              progress={progress}
              color={c.accentBlue}
              trackColor={c.surface}
              animate={false}
            />
            <Text
              style={[
                styles.ringText,
                { color: c.textTertiary, fontFamily: fonts.body },
              ]}
            >
              {totp.secondsRemaining}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('totp.copied')}
            onPress={handleCopy}
            style={[styles.copyBtn, { backgroundColor: c.surface }]}
          >
            <Copy size={16} color={c.accentBlue} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  labelText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontSize: 24,
    letterSpacing: 2,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ring: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringText: {
    position: 'absolute',
    fontSize: 10,
  },
  copyBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 10,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
