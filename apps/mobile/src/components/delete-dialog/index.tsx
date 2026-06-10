import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDialog({ visible, title, onClose, onConfirm }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [isMounted, setIsMounted] = useState(false);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      // Delay unmount until exit animation completes
      const timer = setTimeout(() => setIsMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleConfirm = () => {
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    onConfirm();
  };

  if (!isMounted) return null;

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            accessibilityHint="Close the dialog"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              backgroundColor: c.background,
              borderColor: c.border,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: c.foreground, fontFamily: fonts.heading },
            ]}
          >
            Delete "{title}"?
          </Text>
          <Text
            style={[
              styles.description,
              { color: c.mutedForeground, fontFamily: fonts.body },
            ]}
          >
            This action cannot be undone.
          </Text>

          <View style={styles.buttons}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                { borderColor: c.border, borderWidth: 1 },
                pressed && { backgroundColor: c.hover },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: c.foreground, fontFamily: fonts.bodySemiBold },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: c.accentRed },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: '#FFFFFF', fontFamily: fonts.bodySemiBold },
                ]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 30, 27, 0.28)',
  },
  card: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    boxShadow: '0 18px 40px rgba(31, 30, 27, 0.16)',
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
  },
});
