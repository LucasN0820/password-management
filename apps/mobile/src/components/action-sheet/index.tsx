import { useCallback, useEffect, useRef } from 'react';
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
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

export interface ActionSheetOption {
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
}

export function ActionSheet({ visible, onClose, options }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const translateY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(400, { damping: 25, stiffness: 400 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleOptionPress = useCallback((option: ActionSheetOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCloseRef.current();
    // Delay action to let sheet animate out
    timeoutRef.current = setTimeout(option.onPress, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            accessibilityHint="Close the action sheet"
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle, { backgroundColor: c.background }]}>
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
          </View>

          {/* Options */}
          <View style={[styles.optionsContainer, { borderColor: c.border }]}>
            {options.map((option, i) => {
              const Icon = option.icon;
              const textColor = option.destructive ? c.accentRed : c.foreground;
              const iconColor = option.destructive ? c.accentRed : c.mutedForeground;
              const isLast = i === options.length - 1;

              return (
                <Pressable
                  key={i}
                  onPress={() => handleOptionPress(option)}
                  style={[
                    styles.option,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: c.border },
                  ]}
                >
                  <View style={styles.optionRow}>
                    {Icon && <Icon size={20} color={iconColor} />}
                    <Text style={[styles.optionText, { color: textColor, fontFamily: fonts.body }]}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Cancel button */}
          <Pressable
            onPress={onClose}
            style={[styles.cancelButton, { backgroundColor: c.surface }]}
          >
            <Text style={[styles.cancelText, { color: c.accentBlue, fontFamily: fonts.bodySemiBold }]}>
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(55, 53, 47, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 12,
    paddingBottom: 34,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  optionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 52,
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
});
