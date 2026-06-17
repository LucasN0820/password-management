import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@repo/i18n';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useAppLockStore } from './app-lock-store';

/**
 * Full-screen gate shown whenever the vault is locked. Rendered above the app
 * content (which stays mounted but hidden) so unlocking does not reset
 * navigation state.
 */
export function LockScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const authenticate = useAppLockStore(s => s.authenticate);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const onUnlock = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setFailed(false);
    const success = await authenticate();
    setBusy(false);
    setFailed(!success);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.background,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <View style={styles.body}>
        <View style={[styles.iconShell, { backgroundColor: c.surface }]}>
          <Lock size={32} color={c.foreground} />
        </View>
        <Text
          style={[
            styles.title,
            { color: c.foreground, fontFamily: fonts.heading },
          ]}
        >
          {t('appLock.title')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: c.mutedForeground, fontFamily: fonts.body },
          ]}
        >
          {t('appLock.subtitle')}
        </Text>
        {failed ? (
          <Text
            style={[
              styles.failed,
              { color: c.accentRed, fontFamily: fonts.body },
            ]}
          >
            {t('appLock.failed')}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => void onUnlock()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={t('appLock.unlock')}
        style={[styles.button, { backgroundColor: c.foreground }]}
      >
        {busy ? (
          <ActivityIndicator color={c.background} />
        ) : (
          <Text
            style={[
              styles.buttonText,
              { color: c.background, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {t('appLock.unlock')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  failed: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  button: {
    minHeight: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
  },
});
