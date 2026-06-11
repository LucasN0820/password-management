import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Edit, Globe, Star, Trash2 } from 'lucide-react-native';
import { useMemo, useRef } from 'react';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  Pressable,
} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useMutation } from '@tanstack/react-query';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

interface Props {
  password: Password;
  onEdit?: (id: number) => void;
  onDelete?: (id: number, title: string) => void;
  onLongPress?: (password: Password) => void;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function impact(style: Haptics.ImpactFeedbackStyle) {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.impactAsync(style);
  }
}

export function PasswordItem({
  password,
  onEdit,
  onDelete,
  onLongPress,
}: Props) {
  const { toggleFavorite } = usePasswordStore();
  const router = useRouter();
  const translateX = useSharedValue(0);
  const lastOffset = useRef(0);
  const itemScale = useSharedValue(1);
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const { mutate: favoriteMutate } = useMutation({
    mutationFn: async () => {
      await toggleFavorite(password);
    },
  });

  const handleDelete = () => {
    onDelete?.(password.id, password.title);
  };

  const handleEdit = () => {
    onEdit?.(password.id);
    resetSwipe(150);
  };

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: itemScale.value }],
  }));

  const actionButtonsStyle = useAnimatedStyle(() => {
    const buttonTranslateX = interpolate(
      translateX.value,
      [-120, -100, -80, -60, -40, -20, 0],
      [0, 20, 40, 60, 80, 100, 120]
    );
    return {
      transform: [{ translateX: buttonTranslateX }],
    };
  });

  const resetSwipe = (duration = 250) => {
    translateX.value = withTiming(0, { duration });
    lastOffset.current = 0;
  };

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      'worklet';
      itemScale.value = withTiming(0.97, { duration: 100 });
      runOnJS(impact)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onEnd(() => {
      'worklet';
      itemScale.value = withTiming(1, { duration: 150 });
      if (onLongPress) {
        runOnJS(onLongPress)(password);
      }
    });

  const tap = Gesture.Tap()
    .onEnd(() => {
      router.push({
        pathname: '/password/[id]',
        params: { id: password.id },
      });
      resetSwipe(150);
    })
    .runOnJS(true);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      lastOffset.current = translateX.value;
    })
    .onUpdate(e => {
      const newTranslationX = lastOffset.current + e.translationX;
      translateX.value = clamp(newTranslationX, -120, 0);
    })
    .onEnd(e => {
      const currentTranslation = translateX.value;
      const { velocityX } = e;
      let shouldSnapOpen = false;
      if (
        currentTranslation < -80 ||
        (currentTranslation < -40 && velocityX < -500)
      ) {
        shouldSnapOpen = true;
        impact(Haptics.ImpactFeedbackStyle.Light);
      }
      translateX.value = withTiming(shouldSnapOpen ? -120 : 0, {
        duration: 200,
      });
      lastOffset.current = shouldSnapOpen ? -120 : 0;
    })
    .runOnJS(true);

  const gesture = useMemo(
    () => Gesture.Race(pan, Gesture.Exclusive(longPress, tap)),
    [pan, longPress, tap]
  );

  const getDomainIcon = () => {
    if (password.url) {
      try {
        const url = new URL(password.url);
        return url.hostname.charAt(0).toUpperCase();
      } catch {
        return password.title.charAt(0).toUpperCase();
      }
    }
    return password.title.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.wrapper}>
      {/* Swipe action buttons */}
      <Animated.View style={[styles.actionButtons, actionButtonsStyle]}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: c.foreground }]}
          onPress={handleEdit}
        >
          <Edit size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: c.accentRed }]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      {/* Main content */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: c.card, borderColor: c.border },
            animatedStyles,
          ]}
        >
          {/* Icon circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: c.background, borderColor: c.border },
            ]}
          >
            {password.icon ? (
              <Image source={{ uri: password.icon }} style={styles.iconImage} />
            ) : (
              <Text
                style={[
                  styles.iconText,
                  { color: c.foreground, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {getDomainIcon()}
              </Text>
            )}
          </View>

          {/* Text content */}
          <View style={styles.textContent}>
            <Text
              style={[
                styles.title,
                { color: c.foreground, fontFamily: fonts.bodySemiBold },
              ]}
              numberOfLines={1}
            >
              {password.title}
            </Text>
            <Text
              style={[
                styles.username,
                { color: c.mutedForeground, fontFamily: fonts.body },
              ]}
              numberOfLines={1}
            >
              {password.username}
            </Text>
            {password.url && (
              <View style={styles.urlRow}>
                <Globe size={11} color={c.textTertiary} />
                <Text
                  style={[
                    styles.url,
                    { color: c.textTertiary, fontFamily: fonts.body },
                  ]}
                  numberOfLines={1}
                >
                  {password.url}
                </Text>
              </View>
            )}
          </View>

          {/* Spacer for favorite button area */}
          <View style={styles.favoriteButton} />
        </Animated.View>
      </GestureDetector>

      {/* Favorite star — outside GestureDetector to avoid tap conflict, follows swipe */}
      <Animated.View style={[styles.favoriteButtonOverlay, animatedStyles]}>
        <Pressable
          onPress={() => {
            impact(Haptics.ImpactFeedbackStyle.Light);
            favoriteMutate();
          }}
          style={styles.favoriteButtonHit}
        >
          <Star
            size={18}
            color={password.isFavorite ? c.accentBlue : c.textTertiary}
            fill={password.isFavorite ? c.accentBlue : 'none'}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  actionButtons: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  actionButton: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  iconImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  iconText: {
    fontSize: 18,
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  username: {
    fontSize: 14,
    lineHeight: 18,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  url: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  favoriteButton: {
    width: 34,
    marginLeft: 4,
  },
  favoriteButtonOverlay: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  favoriteButtonHit: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
