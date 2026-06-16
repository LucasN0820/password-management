import { useRouter } from 'expo-router';
import {
  Check,
  ChevronDown,
  Download,
  RotateCw,
  TriangleAlert,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@repo/i18n';
import { CircularProgress } from '@/components/circular-progress';
import {
  cancelActiveDownload,
  dismissActiveDownload,
  retryActiveDownload,
} from '@/features/model-download/download-coordinator';
import { useModelDownloadStore } from '@/features/model-download/download-store';
import {
  downloadStatusKey,
  formatBytes,
} from '@/features/model-download/format';
import { isActiveDownloadState } from '@/features/model-download/types';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

const TAB_BAR_OFFSET = 64;
const MARGIN = 12;
const SUCCESS_DISMISS_MS = 2500;

const BADGE = 56;
const RING_STROKE = 5;
// The ring is inset inside the badge so the circular `overflow: hidden` mask and
// the 1px border never clip the stroke.
const RING_SIZE = BADGE - 8;

// iOS-like spring: settles quickly with a touch of overshoot.
const SPRING = { damping: 18, stiffness: 190, mass: 0.85 };

export function GlobalModelDownloadBanner() {
  const task = useModelDownloadStore(state => state.activeTask);
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const cardWidth = width - MARGIN * 2;
  const [expanded, setExpanded] = useState(false);
  const [cardHeight, setCardHeight] = useState(108);

  const open = useSharedValue(0);

  const completed = task?.state === 'completed';
  const failed = task?.state === 'failed';
  const active = task ? isActiveDownloadState(task.state) : false;
  const fraction = task?.fraction ?? 0;

  useEffect(() => {
    open.value = withSpring(expanded ? 1 : 0, SPRING);
  }, [expanded, open]);

  // Reset to the collapsed badge whenever the task goes away.
  useEffect(() => {
    if (!task) setExpanded(false);
  }, [task]);

  // Success briefly shows, then collapses and dismisses.
  useEffect(() => {
    if (!completed) return;
    const timer = setTimeout(() => void dismissActiveDownload(), SUCCESS_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [completed]);

  const containerStyle = useAnimatedStyle(() => ({
    width: interpolate(open.value, [0, 1], [BADGE, cardWidth]),
    height: interpolate(open.value, [0, 1], [BADGE, cardHeight]),
    borderRadius: interpolate(open.value, [0, 1], [BADGE / 2, 18]),
  }), [cardWidth, cardHeight]);

  const badgeLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.45], [1, 0]),
  }));

  const cardLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0.55, 1], [0, 1]),
  }));

  // The clip layer matches the outer radius so the border follows the morph.
  const radiusStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(open.value, [0, 1], [BADGE / 2, 18]),
  }));

  // The card surface (background + border + shadow) only exists once expanded;
  // collapsed, the badge is just the floating ring with a transparent centre.
  const surfaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.4], [0, 1]),
  }));

  if (!task) return null;
  if (task.state === 'cancelled-by-user') return null;

  const percent = Math.round(fraction * 100);
  const ringColor = failed ? c.accentRed : c.accentGreen;

  const confirmCancel = () => {
    Alert.alert(
      t('aiImport.cancelDownload'),
      t('aiImport.cancelDownloadConfirm', { name: task.modelName }),
      [
        { text: t('aiImport.cancel'), style: 'cancel' },
        {
          text: t('aiImport.cancelDownload'),
          style: 'destructive',
          onPress: () => void cancelActiveDownload('user'),
        },
      ]
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_OFFSET }]}
    >
      {/* Sizing container — no visual of its own. */}
      <Animated.View style={[styles.shadowWrap, containerStyle]}>
        {/* Card surface: background + border + shadow, fades in when expanded. */}
        <Animated.View
          style={[
            styles.surface,
            { backgroundColor: c.card, borderColor: c.border },
            radiusStyle,
            surfaceStyle,
          ]}
        />
        {/* Inner layer clips the morph content. */}
        <Animated.View style={[styles.clip, radiusStyle]}>
          {/* Collapsed badge */}
          <Animated.View
            pointerEvents={expanded ? 'none' : 'auto'}
            style={[styles.badgeLayer, badgeLayerStyle]}
          >
            <Pressable
              onPress={() => setExpanded(true)}
              style={styles.badgePress}
            >
              <CircularProgress
                size={RING_SIZE}
                strokeWidth={RING_STROKE}
                progress={completed ? 1 : active ? fraction : 0}
                color={ringColor}
                trackColor={c.border}
              />
              <View style={styles.badgeCenter} pointerEvents="none">
                <BadgeCenter
                  completed={completed}
                  failed={failed}
                  state={task.state}
                  percent={percent}
                  color={c.foreground}
                  accentGreen={c.accentGreen}
                  accentRed={c.accentRed}
                />
              </View>
            </Pressable>
          </Animated.View>

          {/* Expanded card */}
          <Animated.View
            pointerEvents={expanded ? 'auto' : 'none'}
            onLayout={e => setCardHeight(e.nativeEvent.layout.height)}
            style={[styles.cardLayer, { width: cardWidth }, cardLayerStyle]}
          >
            <View style={styles.cardRow}>
              {active ? (
                <ActivityIndicator size="small" color={c.foreground} />
              ) : (
                <Download
                  size={18}
                  color={failed ? c.accentRed : c.accentGreen}
                />
              )}
              <Pressable
                style={styles.cardBody}
                onPress={() => router.push('/ai-import')}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    { color: c.foreground, fontFamily: fonts.bodySemiBold },
                  ]}
                >
                  {task.modelName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.caption,
                    { color: c.mutedForeground, fontFamily: fonts.caption },
                  ]}
                >
                  {active && task.state === 'downloading'
                    ? t('aiImport.downloadProgress', {
                      percent,
                      downloaded: formatBytes(task.downloadedBytes),
                      total: formatBytes(task.totalBytes),
                    })
                    : completed
                      ? t('aiImport.downloadComplete')
                      : failed
                        ? t('aiImport.downloadFailed')
                        : t(downloadStatusKey(task.state))}
                </Text>
              </Pressable>
              {failed ? (
                <Pressable
                  onPress={() => void retryActiveDownload()}
                  hitSlop={10}
                  style={styles.action}
                >
                  <RotateCw size={18} color={c.accentBlue} />
                </Pressable>
              ) : null}
              {active ? (
                <Pressable
                  onPress={confirmCancel}
                  hitSlop={10}
                  style={styles.action}
                >
                  <X size={18} color={c.accentRed} />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setExpanded(false)}
                hitSlop={10}
                style={[styles.action, styles.collapse, { borderColor: c.border }]}
              >
                <ChevronDown size={18} color={c.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.track, { backgroundColor: c.border }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${completed ? 100 : percent}%`,
                    backgroundColor: failed ? c.accentRed : c.accentGreen,
                  },
                ]}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function BadgeCenter({
  completed,
  failed,
  state,
  percent,
  color,
  accentGreen,
  accentRed,
}: {
  completed: boolean;
  failed: boolean;
  state: string;
  percent: number;
  color: string;
  accentGreen: string;
  accentRed: string;
}) {
  if (completed) return <Check size={24} color={accentGreen} strokeWidth={3} />;
  if (failed) return <TriangleAlert size={22} color={accentRed} />;
  if (state === 'downloading' || state === 'starting' || state === 'queued') {
    return (
      <Text style={[styles.badgePercent, { color, fontFamily: fonts.bodySemiBold }]}>
        {percent}%
      </Text>
    );
  }
  return <ActivityIndicator size="small" color={color} />;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: MARGIN,
    alignItems: 'flex-end',
  },
  shadowWrap: {
    borderCurve: 'continuous',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderCurve: 'continuous',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  badgeLayer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: BADGE,
    height: BADGE,
  },
  badgePress: {
    width: BADGE,
    height: BADGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePercent: { fontSize: 13 },
  cardLayer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardBody: { flex: 1, gap: 2 },
  title: { fontSize: 14 },
  caption: { fontSize: 12, lineHeight: 16 },
  action: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapse: {
    borderWidth: 1,
    borderRadius: 12,
  },
  track: { height: 4, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 999 },
});
