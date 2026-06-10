import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

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
  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(400, { damping: 25, stiffness: 400 });
      // Delay unmount until exit animation completes
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
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
            accessibilityHint="Close the action sheet"
          />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, sheetStyle, { backgroundColor: c.background }]}
        >
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
          </View>

          {/* Options */}
          <View
            style={[
              styles.optionsContainer,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            {options.map((option, i) => {
              const Icon = option.icon;
              const textColor = option.destructive ? c.accentRed : c.foreground;
              const iconColor = option.destructive
                ? c.accentRed
                : c.mutedForeground;
              const isLast = i === options.length - 1;

              return (
                <Pressable
                  key={i}
                  onPress={() => handleOptionPress(option)}
                  style={[
                    styles.option,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: c.border,
                    },
                  ]}
                >
                  <View style={styles.optionRow}>
                    {Icon && <Icon size={20} color={iconColor} />}
                    <Text
                      style={[
                        styles.optionText,
                        { color: textColor, fontFamily: fonts.body },
                      ]}
                    >
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
            style={[styles.cancelButton, { backgroundColor: c.card }]}
          >
            <Text
              style={[
                styles.cancelText,
                { color: c.accentBlue, fontFamily: fonts.bodySemiBold },
              ]}
            >
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
    backgroundColor: 'rgba(31, 30, 27, 0.36)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderCurve: 'continuous',
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
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
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
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
});
