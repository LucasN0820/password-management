import { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  message?: string;
  onHide: () => void;
}

export function CopyToast({
  visible,
  message = 'Copied to clipboard',
  onHide,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0, { duration: 200 }))
      );
      // Auto-hide after fade-out animation completes
      const timer = setTimeout(() => {
        onHideRef.current();
        setIsMounted(false);
      }, 1900);
      return () => clearTimeout(timer);
    } else {
      // Exit animation
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-100, { duration: 200 });
      const timer = setTimeout(() => setIsMounted(false), 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isMounted) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { top: insets.top + 8, backgroundColor: c.foreground },
      ]}
    >
      <Text style={[styles.text, { fontFamily: fonts.bodySemiBold }]}>
        {message} ✓
      </Text>
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
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
