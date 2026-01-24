// apps/mobile/components/onboarding/hook-screen.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';

const { width, height } = Dimensions.get('window');

type HookScreenProps = {
  onComplete: () => void;
  autoAdvanceDelay?: number;
};

export function HookScreen({ onComplete, autoAdvanceDelay = 3500 }: HookScreenProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const lightningAnim = useRef(new Animated.Value(0)).current;
  const rainAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: fade in background -> lightning flash -> text fade in -> auto advance
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(lightningAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(lightningAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Rain animation loop
    Animated.loop(
      Animated.timing(rainAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Auto advance timer
    const timer = setTimeout(onComplete, autoAdvanceDelay);
    return () => clearTimeout(timer);
  }, [fadeAnim, textFadeAnim, lightningAnim, rainAnim, onComplete, autoAdvanceDelay]);

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
    >
      {/* Dark dramatic background */}
      <View style={styles.backgroundOverlay} />

      {/* Lightning flash overlay */}
      <Animated.View
        style={[
          styles.lightningOverlay,
          { opacity: lightningAnim }
        ]}
      />

      {/* Rain effect - simplified with animated lines */}
      <View style={styles.rainContainer}>
        {Array.from({ length: 30 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.rainDrop,
              {
                left: `${(i * 3.5) % 100}%`,
                top: `${(i * 7) % 100}%`,
                opacity: rainAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.7],
                }),
                transform: [{
                  translateY: rainAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 50],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>

      {/* Car silhouette */}
      <View style={styles.carContainer}>
        <View style={styles.carSilhouette}>
          <View style={styles.carBody} />
          <View style={styles.carRoof} />
          <View style={[styles.carWheel, styles.carWheelLeft]} />
          <View style={[styles.carWheel, styles.carWheelRight]} />
          {/* Headlights glow */}
          <View style={styles.headlightGlow} />
        </View>
        {/* Road line */}
        <View style={styles.roadLine} />
      </View>

      {/* Text content */}
      <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
        <Text style={styles.hookText}>
          {t('onboarding.hook.text')}
        </Text>
      </Animated.View>

      {/* Tap to continue hint */}
      <Animated.View style={[styles.tapHint, { opacity: textFadeAnim }]}>
        <Text style={styles.tapHintText}>
          {t('common.continue')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0f',
  },
  lightningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  rainContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(150, 180, 200, 0.4)',
    borderRadius: 1,
  },
  carContainer: {
    position: 'absolute',
    bottom: height * 0.35,
    alignItems: 'center',
  },
  carSilhouette: {
    width: 120,
    height: 45,
    position: 'relative',
  },
  carBody: {
    position: 'absolute',
    bottom: 8,
    width: 120,
    height: 25,
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
  },
  carRoof: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    width: 70,
    height: 20,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  carWheel: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 20,
    backgroundColor: '#0f0f1a',
    borderRadius: 10,
  },
  carWheelLeft: {
    left: 15,
  },
  carWheelRight: {
    right: 15,
  },
  headlightGlow: {
    position: 'absolute',
    bottom: 15,
    right: -10,
    width: 30,
    height: 8,
    backgroundColor: 'rgba(255, 220, 100, 0.3)',
    borderRadius: 10,
  },
  roadLine: {
    marginTop: 15,
    width: width * 0.6,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  textContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    paddingHorizontal: 40,
  },
  hookText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  tapHint: {
    position: 'absolute',
    bottom: 60,
  },
  tapHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
