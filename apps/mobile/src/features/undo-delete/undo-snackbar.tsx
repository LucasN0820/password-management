import { Trash2, Undo2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@repo/i18n';
import { usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useUndoDeleteStore } from './undo-store';

const VISIBLE_MS = 5000;
const SPRING = { damping: 20, stiffness: 200, mass: 0.8 };

/**
 * Bottom snackbar offering to undo the most recent delete. Mounted once at the
 * app root (inside the password provider). Auto-dismisses after a few seconds.
 */
export function UndoDeleteSnackbar() {
  const { t } = useTranslation();
  const deleted = useUndoDeleteStore(state => state.deleted);
  const nonce = useUndoDeleteStore(state => state.nonce);
  const dismiss = useUndoDeleteStore(state => state.dismiss);
  const { addPassword } = usePasswordStore();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  const translateY = useSharedValue(160);
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!deleted) return;
    translateY.value = withSpring(0, SPRING);
    opacity.value = withTiming(1, { duration: 180 });
    const timer = setTimeout(() => {
      translateY.value = withTiming(160, { duration: 240 });
      opacity.value = withTiming(0, { duration: 240 }, finished => {
        if (finished) runOnJS(dismiss)();
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
    // `nonce` restarts the timer when a newer delete replaces the current one.
  }, [deleted, nonce, dismiss, opacity, translateY]);

  if (!deleted) return null;

  const handleUndo = async () => {
    const { id, created_at, updated_at, ...input } = deleted;
    void id;
    void created_at;
    void updated_at;
    await addPassword(input);
    dismiss();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + 16 }, style]}
    >
      <View
        style={[styles.bar, { backgroundColor: c.foreground }]}
        pointerEvents="auto"
      >
        <Trash2 size={16} color={c.background} />
        <Text
          numberOfLines={1}
          style={[styles.text, { color: c.background, fontFamily: fonts.body }]}
        >
          {t('list.deleted', { title: deleted.title })}
        </Text>
        <Pressable
          onPress={() => void handleUndo()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('list.undo')}
          style={styles.undoButton}
        >
          <Undo2 size={15} color={c.background} />
          <Text
            style={[
              styles.undoText,
              { color: c.background, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {t('list.undo')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '92%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderCurve: 'continuous',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { fontSize: 14, flexShrink: 1 },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 6,
  },
  undoText: { fontSize: 14 },
});
