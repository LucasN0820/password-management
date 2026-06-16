import { CheckCircle2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

const VISIBLE_MS = 2400;
const SPRING = { damping: 20, stiffness: 200, mass: 0.8 };

interface ToastState {
  message: string | null;
  /** Bumped on each show so re-showing the same text still re-triggers. */
  nonce: number;
  show: (message: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  message: null,
  nonce: 0,
  show: message => set(state => ({ message, nonce: state.nonce + 1 })),
  clear: () => set({ message: null }),
}));

/** Lightweight global success toast, mounted once at the root. */
export function Toast() {
  const message = useToastStore(state => state.message);
  const nonce = useToastStore(state => state.nonce);
  const clear = useToastStore(state => state.clear);
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!message) return;
    translateY.value = withSpring(0, SPRING);
    opacity.value = withTiming(1, { duration: 180 });
    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 240 });
      opacity.value = withTiming(0, { duration: 240 }, finished => {
        if (finished) runOnJS(clear)();
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
    // `nonce` re-runs the animation when the same message is shown again.
  }, [message, nonce, clear, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 8 }, style]}
    >
      <View
        style={[styles.toast, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <CheckCircle2 size={18} color={c.accentGreen} />
        <Text
          numberOfLines={2}
          style={[
            styles.text,
            { color: c.foreground, fontFamily: fonts.bodySemiBold },
          ]}
        >
          {message}
        </Text>
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '92%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 999,
    borderCurve: 'continuous',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { fontSize: 14, flexShrink: 1 },
});
