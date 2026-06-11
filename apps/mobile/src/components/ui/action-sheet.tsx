import { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/theme/globals';
import { useColor } from '@/hooks/useColor';

export interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
  title?: string;
}

export function ActionSheet({
  visible,
  onClose,
  options,
  title,
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  const bg = useColor('background');
  const surface = useColor('surface');
  const fg = useColor('foreground');
  const border = useColor('border');
  const muted = useColor('mutedForeground');
  const red = useColor('accentRed');
  const blue = useColor('accentBlue');

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(400, { duration: 200 });
    }
  }, [visible, opacity, translateY]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.4,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = useCallback(
    (option: ActionSheetOption) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      // Small delay to let animation complete
      setTimeout(option.onPress, 200);
    },
    [onClose]
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: fg },
              overlayStyle,
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 8 },
            sheetStyle,
          ]}
        >
          {/* Main options group */}
          <View
            style={[
              styles.optionsGroup,
              { backgroundColor: bg, borderColor: border },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: border }]} />
            </View>

            {title && (
              <Text
                style={[
                  styles.title,
                  { color: muted, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {title}
              </Text>
            )}

            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  index < options.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: border,
                  },
                ]}
                onPress={() => handlePress(option)}
                activeOpacity={0.6}
              >
                {option.icon && (
                  <View style={styles.optionIcon}>{option.icon}</View>
                )}
                <Text
                  style={[
                    styles.optionText,
                    { fontFamily: fonts.body },
                    { color: option.destructive ? red : fg },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: bg }]}
            onPress={onClose}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.cancelText,
                { color: blue, fontFamily: fonts.bodySemiBold },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
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
  sheet: {
    paddingHorizontal: 12,
    gap: 8,
  },
  optionsGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 52,
  },
  optionIcon: {
    marginRight: 14,
    width: 22,
    alignItems: 'center',
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
