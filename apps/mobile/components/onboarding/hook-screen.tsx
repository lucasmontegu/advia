// apps/mobile/components/onboarding/hook-screen.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';

const { width, height } = Dimensions.get('window');

type HookScreenProps = {
  onComplete: () => void;
  autoAdvanceDelay?: number;
};

// Generate rain drops with varied properties
const RAIN_DROPS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  left: `${(i * 2.5) % 100}%`,
  delay: i * 30,
  duration: 800 + (i % 5) * 100,
  height: 15 + (i % 3) * 10,
}));

export function HookScreen({ onComplete, autoAdvanceDelay = 4000 }: HookScreenProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  // Shared values for animations
  const containerOpacity = useSharedValue(0);
  const lightningOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const carGlow = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Initial fade in
    containerOpacity.value = withTiming(1, { duration: 600 });

    // Lightning flash sequence (dramatic effect)
    lightningOpacity.value = withDelay(
      800,
      withSequence(
        withTiming(0.9, { duration: 80 }),
        withTiming(0, { duration: 60 }),
        withDelay(200, withSequence(
          withTiming(0.7, { duration: 60 }),
          withTiming(0, { duration: 80 })
        ))
      )
    );

    // Text fade in after lightning
    textOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    textTranslateY.value = withDelay(1200, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // Car headlight glow pulse
    carGlow.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1
    ));

    // Pulse animation for tap hint
    pulseScale.value = withDelay(2500, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1
    ));

    // Auto advance timer
    const timer = setTimeout(() => {
      runOnJS(onComplete)();
    }, autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const lightningStyle = useAnimatedStyle(() => ({
    opacity: lightningOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const headlightStyle = useAnimatedStyle(() => ({
    opacity: carGlow.value,
    transform: [{ scaleX: interpolate(carGlow.value, [0.3, 0.8], [1, 1.3]) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Gradient background - stormy sky */}
      <LinearGradient
        colors={['#0a0a0f', '#0d1117', '#161b22']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Lightning flash overlay */}
      <Animated.View style={[styles.lightningOverlay, lightningStyle]} />

      {/* Storm clouds layer */}
      <View style={styles.cloudsContainer}>
        <Animated.View
          entering={FadeIn.delay(300).duration(1000)}
          style={[styles.cloud, styles.cloudLarge]}
        />
        <Animated.View
          entering={FadeIn.delay(500).duration(1000)}
          style={[styles.cloud, styles.cloudMedium]}
        />
        <Animated.View
          entering={FadeIn.delay(400).duration(1000)}
          style={[styles.cloud, styles.cloudSmall]}
        />
      </View>

      {/* Rain effect - using Reanimated */}
      <View style={styles.rainContainer}>
        {RAIN_DROPS.map((drop) => (
          <RainDrop key={drop.id} {...drop} />
        ))}
      </View>

      {/* Car silhouette with enhanced glow */}
      <View style={styles.carContainer}>
        <View style={styles.carSilhouette}>
          <View style={styles.carBody} />
          <View style={styles.carRoof} />
          <View style={[styles.carWheel, styles.carWheelLeft]} />
          <View style={[styles.carWheel, styles.carWheelRight]} />
          {/* Animated headlight glow */}
          <Animated.View style={[styles.headlightGlow, headlightStyle]} />
          <Animated.View style={[styles.headlightBeam, headlightStyle]} />
        </View>
        {/* Road with dashed line */}
        <View style={styles.road}>
          <View style={styles.roadLine} />
          <View style={styles.roadDash} />
        </View>
      </View>

      {/* Text content with staggered animation */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.hookTextLarge}>
          {t('onboarding.hook.text')}
        </Text>
        <View style={styles.statsRow}>
          <Animated.View
            entering={FadeInUp.delay(2000).duration(500)}
            style={styles.statBadge}
          >
            <Text style={styles.statNumber}>47%</Text>
            <Text style={styles.statLabel}>of accidents happen{'\n'}in bad weather</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Tap to continue hint */}
      <Animated.View style={[styles.tapHint, pulseStyle]}>
        <View style={styles.tapHintPill}>
          <Text style={styles.tapHintText}>{t('common.continue')}</Text>
          <Text style={styles.tapHintArrow}>→</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Individual rain drop component with its own animation
function RainDrop({ left, delay, duration, height: dropHeight }: {
  left: string;
  delay: number;
  duration: number;
  height: number;
}) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start rain animation with delay
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(height * 0.7, { duration, easing: Easing.linear }),
        -1
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.2 }),
          withTiming(0.6, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        { left, height: dropHeight },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 100,
  },
  cloudsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 40, 50, 0.8)',
    borderRadius: 50,
  },
  cloudLarge: {
    top: height * 0.08,
    left: -30,
    width: width * 0.6,
    height: 80,
  },
  cloudMedium: {
    top: height * 0.15,
    right: -20,
    width: width * 0.5,
    height: 60,
  },
  cloudSmall: {
    top: height * 0.22,
    left: width * 0.3,
    width: width * 0.4,
    height: 50,
  },
  rainContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    top: 0,
    backgroundColor: 'rgba(150, 200, 255, 0.5)',
    borderRadius: 1,
  },
  carContainer: {
    position: 'absolute',
    bottom: height * 0.32,
    alignItems: 'center',
  },
  carSilhouette: {
    width: 140,
    height: 50,
    position: 'relative',
  },
  carBody: {
    position: 'absolute',
    bottom: 10,
    width: 140,
    height: 28,
    backgroundColor: '#1e2530',
    borderRadius: 8,
  },
  carRoof: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 80,
    height: 24,
    backgroundColor: '#1e2530',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  carWheel: {
    position: 'absolute',
    bottom: 0,
    width: 22,
    height: 22,
    backgroundColor: '#0f1218',
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#2a3444',
  },
  carWheelLeft: {
    left: 18,
  },
  carWheelRight: {
    right: 18,
  },
  headlightGlow: {
    position: 'absolute',
    bottom: 18,
    right: -15,
    width: 40,
    height: 10,
    backgroundColor: 'rgba(255, 220, 100, 0.6)',
    borderRadius: 10,
  },
  headlightBeam: {
    position: 'absolute',
    bottom: 14,
    right: -60,
    width: 80,
    height: 18,
    backgroundColor: 'rgba(255, 240, 180, 0.15)',
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
  },
  road: {
    marginTop: 18,
    alignItems: 'center',
  },
  roadLine: {
    width: width * 0.7,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
  },
  roadDash: {
    marginTop: 4,
    width: width * 0.15,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  textContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  hookTextLarge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 22,
    lineHeight: 34,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statsRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#EF4444',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  tapHint: {
    position: 'absolute',
    bottom: 50,
  },
  tapHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  tapHintText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tapHintArrow: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
