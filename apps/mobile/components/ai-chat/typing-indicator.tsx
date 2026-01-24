import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface TypingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
}

const DOT_SIZES = {
  sm: 6,
  md: 8,
  lg: 10,
};

const CONTAINER_PADDING = {
  sm: 8,
  md: 12,
  lg: 16,
};

export function TypingIndicator({ size = 'md' }: TypingIndicatorProps) {
  const colors = useThemeColors();
  const dotSize = DOT_SIZES[size];
  const padding = CONTAINER_PADDING[size];

  const dot1Scale = useSharedValue(0.8);
  const dot2Scale = useSharedValue(0.8);
  const dot3Scale = useSharedValue(0.8);

  const dot1Opacity = useSharedValue(0.4);
  const dot2Opacity = useSharedValue(0.4);
  const dot3Opacity = useSharedValue(0.4);

  useEffect(() => {
    const animateDot = (
      scale: Animated.SharedValue<number>,
      opacity: Animated.SharedValue<number>,
      delay: number
    ) => {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.2, { duration: 300 }),
            withTiming(0.8, { duration: 300 })
          ),
          -1,
          false
        )
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.4, { duration: 300 })
          ),
          -1,
          false
        )
      );
    };

    animateDot(dot1Scale, dot1Opacity, 0);
    animateDot(dot2Scale, dot2Opacity, 150);
    animateDot(dot3Scale, dot3Opacity, 300);
  }, [dot1Scale, dot1Opacity, dot2Scale, dot2Opacity, dot3Scale, dot3Opacity]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
    opacity: dot3Opacity.value,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.muted,
          paddingHorizontal: padding * 1.5,
          paddingVertical: padding,
          borderRadius: dotSize * 2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          dot1Style,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.primary,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          dot2Style,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.primary,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          dot3Style,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {},
});
