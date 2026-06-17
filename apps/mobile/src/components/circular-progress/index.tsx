import { useEffect, useId } from 'react';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Mix a hex colour toward white by `amount` (0..1) for the gradient highlight. */
function lighten(hex: string, amount: number) {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const channel = (start: number) => {
    const ch = parseInt(value.slice(start, start + 2), 16);
    return Math.round(ch + (255 - ch) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  /** Fraction filled, in the 0..1 range. */
  progress: number;
  color: string;
  trackColor: string;
  /** Animate the arc when `progress` changes. */
  animate?: boolean;
  durationMs?: number;
}

/**
 * A track + rounded-cap progress ring with a subtle two-stop gradient for depth.
 * Starts at 12 o'clock and fills clockwise.
 */
export function CircularProgress({
  size,
  strokeWidth,
  progress,
  color,
  trackColor,
  animate = true,
  durationMs = 300,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gradientId = `cp-${useId().replaceAll(/[^a-z0-9]/gi, '')}`;

  const value = useSharedValue(progress);
  useEffect(() => {
    value.value = animate
      ? withTiming(progress, { duration: durationMs })
      : progress;
  }, [progress, animate, durationMs, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.min(Math.max(value.value, 0), 1)),
  }));

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={lighten(color, 0.22)} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
}
