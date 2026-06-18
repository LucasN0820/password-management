import { Lock } from 'lucide-react-native';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Colors } from '@/theme/colors';

/**
 * Opaque, button-less cover used for transient states: the pre-auth window on
 * cold start and the moment the app is backgrounded. It exists purely to hide
 * vault contents (including from the OS app-switcher snapshot); it never asks
 * for authentication itself.
 */
export function PrivacyCover() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  return (
    <View style={[styles.cover, { backgroundColor: c.background }]}>
      <Lock size={28} color={c.textTertiary} />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
