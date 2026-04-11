import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/theme/globals';
import { useColor } from '@/hooks/useColor';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  message,
  visible,
  onHide,
  duration = 1500,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const green = useColor('accentGreen');

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 200 });
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(
          duration,
          withTiming(0, { duration: 200 }, finished => {
            if (finished) {
              runOnJS(onHide)();
            }
          })
        )
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(duration, withTiming(-100, { duration: 200 }))
      );
    }
  }, [visible, duration, onHide, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: green },
        animatedStyle,
      ]}
    >
      <Animated.Text style={[styles.text, { fontFamily: fonts.bodySemiBold }]}>
        {message}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
