import { Password, usePasswordStore } from '@/store/passwordStore';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  Pressable,
} from 'react-native-gesture-handler';
import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Edit, Trash2, Star, Globe } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import { useRouter } from 'expo-router';

interface Props {
  password: Password;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export function PasswordItem({ password }: Props) {
  const { deletePassword, toggleFavorite } = usePasswordStore();
  const router = useRouter();
  const translateX = useSharedValue(0);
  const lastOffset = useRef(0);

  const backgroundColor = useColor('background');
  const textColor = useColor('text');
  const primaryColor = useColor('primary');
  const destructiveColor = useColor('red');
  const itemBackgroundColor = useColor('card');

  const { mutate: deleteMutate } = useMutation({
    mutationFn: async () => {
      await deletePassword(password.id);
    },
  });

  const { mutate: favoriteMutate } = useMutation({
    mutationFn: async () => {
      await toggleFavorite(password);
    },
  });

  const handleDelete = () => {
    Alert.alert(
      '删除密码',
      `确定要删除 "${password.title}" 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteMutate(),
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: '/password/[id]',
      params: {
        id: password.id,
      },
    });
    resetSwipe(1300);
  };

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionButtonsStyle = useAnimatedStyle(() => {
    // Action buttons should appear from right to left as user swipes left
    const buttonTranslateX = interpolate(
      translateX.value,
      [-120, -100, -80, -60, -40, -20, 0],
      [0, 20, 40, 60, 80, 100, 120]
    );

    return {
      transform: [{ translateX: buttonTranslateX }],
    };
  });

  const resetSwipe = (stiffness: number = 100) => {
    translateX.value = withSpring(0, {
      stiffness,
    });
    lastOffset.current = 0;
  };

  const tap = Gesture.Tap()
    .onEnd(() => {
      handleEdit();
    })
    .runOnJS(true);

  const pan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      // Reset last offset when starting new gesture
      lastOffset.current = translateX.value;
    })
    .onUpdate(e => {
      // Calculate new translation with boundaries
      const newTranslationX = lastOffset.current + e.translationX;
      translateX.value = clamp(newTranslationX, -120, 0);
    })
    .onEnd(e => {
      // Determine snap position based on final position and velocity
      const currentTranslation = translateX.value;
      const { velocityX } = e;

      let shouldSnapOpen = false;

      // Snap open if swiped far enough or with sufficient velocity
      if (
        currentTranslation < -80 ||
        (currentTranslation < -40 && velocityX < -500)
      ) {
        shouldSnapOpen = true;
      }

      // Apply spring animation to snap position
      translateX.value = withSpring(shouldSnapOpen ? -120 : 0, {
        damping: 20,
        stiffness: 100,
        mass: 1,
      });

      // Update last offset
      lastOffset.current = shouldSnapOpen ? -120 : 0;
    })
    .runOnJS(true);

  const gesture = Gesture.Exclusive(pan, tap);

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
    <View style={[styles.container, { backgroundColor }]}>
      {/* Action buttons - hidden by default, revealed on left swipe */}
      <Animated.View style={[styles.actionButtons, actionButtonsStyle]}>
        <Pressable
          style={[
            styles.actionButton,
            styles.editButton,
            { backgroundColor: primaryColor },
          ]}
          onPress={() => {
            handleEdit();
          }}
        >
          <Edit size={20} color="white" />
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: destructiveColor },
          ]}
          onPress={() => {
            handleDelete();
          }}
        >
          <Trash2 size={20} color="white" />
        </Pressable>
      </Animated.View>
      {/* Main content */}
      <GestureDetector gesture={gesture}>
        <TouchableOpacity activeOpacity={0.9}>
          <Animated.View
            style={[
              styles.content,
              {
                backgroundColor: itemBackgroundColor,
              },
              animatedStyles,
            ]}
          >
            <View style={styles.leftSection}>
              <View style={styles.iconContainer}>
                <Text style={[styles.iconText]}>{getDomainIcon()}</Text>
              </View>
            </View>

            <View style={styles.middleSection}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: textColor }]}
                  numberOfLines={1}
                >
                  {password.title}
                </Text>
                {password.favorite === 1 && (
                  <Star size={16} color="#f59e0b" fill="#f59e0b" />
                )}
              </View>
              <Text
                style={[styles.subtitle, { color: `${textColor}80` }]}
                numberOfLines={1}
              >
                {password.username}
              </Text>
              {password.url && (
                <View style={styles.urlRow}>
                  <Globe size={12} color={`${textColor}60`} />
                  <Text
                    style={[styles.url, { color: `${textColor}60` }]}
                    numberOfLines={1}
                  >
                    {password.url}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={e => {
                e.stopPropagation();
                favoriteMutate();
              }}
            >
              <Star
                size={18}
                color={password.favorite === 1 ? '#f59e0b' : `${textColor}40`}
                fill={password.favorite === 1 ? '#f59e0b' : 'none'}
              />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginHorizontal: 16,
    // marginVertical: 4,
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
  editButton: {
    marginRight: 0,
  },
  deleteButton: {},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leftSection: {
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '600',
  },
  middleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  url: {
    fontSize: 12,
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
