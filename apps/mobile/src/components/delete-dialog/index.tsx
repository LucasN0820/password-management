import { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDialog({ visible, title, onClose, onConfirm }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onConfirm();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.card, cardStyle, {
          backgroundColor: c.background,
          borderColor: c.border,
        }]}>
          <Text style={[styles.title, { color: c.foreground, fontFamily: fonts.heading }]}>
            Delete "{title}"?
          </Text>
          <Text style={[styles.description, { color: c.mutedForeground, fontFamily: fonts.body }]}>
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
              <Text style={[styles.buttonText, { color: c.foreground, fontFamily: fonts.bodySemiBold }]}>
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
              <Text style={[styles.buttonText, { color: '#FFFFFF', fontFamily: fonts.bodySemiBold }]}>
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
    backgroundColor: 'rgba(55, 53, 47, 0.2)',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
  },
});
