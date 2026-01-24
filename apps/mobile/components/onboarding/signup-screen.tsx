// apps/mobile/components/onboarding/signup-screen.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { Icon } from '@/components/icons';

type SignupScreenProps = {
  onCreateAccount: () => void;
  onContinueAsGuest: () => void;
  driverCount?: number;
};

// Animated counter hook for social proof
function useAnimatedCounter(target: number, duration: number = 2000, delay: number = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (target - startValue) * eased);

        setCount(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return count;
}

export function SignupScreen({
  onCreateAccount,
  onContinueAsGuest,
  driverCount = 12847,
}: SignupScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Animated counter for social proof
  const animatedCount = useAnimatedCounter(driverCount, 2000, 1200);

  // Shield animation values
  const shieldScale = useSharedValue(0.8);
  const shieldRotate = useSharedValue(-5);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // CTA button animation
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    // Shield entrance animation
    shieldScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    shieldRotate.value = withDelay(200, withSpring(0, { damping: 15 }));

    // Glow effect
    glowOpacity.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.2, { duration: 1500 })
      ),
      -1
    ));

    // Pulse animation for shield
    pulseScale.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1
    ));

    // CTA button subtle pulse
    ctaScale.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1
    ));
  }, []);

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shieldScale.value },
      { rotate: `${shieldRotate.value}deg` },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.2, 0.6], [1, 1.1]) }],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top section with animated shield illustration */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={[styles.topSection, { paddingTop: insets.top + 24 }]}
      >
        {/* Safety shield illustration with glow */}
        <Animated.View style={[styles.illustrationContainer, shieldStyle]}>
          {/* Glow effect */}
          <Animated.View style={[styles.shieldGlow, { backgroundColor: colors.primary }, glowStyle]} />

          <Animated.View style={[styles.shieldOuter, { backgroundColor: colors.primary + '15' }, pulseStyle]}>
            <View style={[styles.shieldMiddle, { backgroundColor: colors.primary + '25' }]}>
              <LinearGradient
                colors={[colors.primary, '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shieldInner}
              >
                <Icon name="storm" size={52} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Floating animated badges */}
          <FloatingBadge delay={500} style={styles.badgeTopLeft} color="#10B981">
            <Text style={styles.badgeIcon}>✓</Text>
          </FloatingBadge>

          <FloatingBadge delay={650} style={styles.badgeTopRight} color="#F59E0B">
            <Icon name="weather" size={16} color="#FFFFFF" />
          </FloatingBadge>

          <FloatingBadge delay={800} style={styles.badgeBottomRight} color={colors.primary}>
            <Icon name="route" size={16} color="#FFFFFF" />
          </FloatingBadge>

          <FloatingBadge delay={950} style={styles.badgeBottomLeft} color="#EF4444">
            <Icon name="notification" size={16} color="#FFFFFF" />
          </FloatingBadge>
        </Animated.View>
      </Animated.View>

      {/* Content section */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(600)}
        style={styles.contentSection}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('onboarding.signup.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Join thousands of safer drivers
        </Text>

        {/* Feature list with staggered animation */}
        <View style={styles.featureList}>
          <AnimatedFeatureItem
            icon="notification"
            text="Real-time storm alerts"
            highlight="before they hit"
            colors={colors}
            delay={600}
          />
          <AnimatedFeatureItem
            icon="voice"
            text="AI co-pilot"
            highlight="for every drive"
            colors={colors}
            delay={750}
          />
          <AnimatedFeatureItem
            icon="location"
            text="Smart safe stops"
            highlight="when you need them"
            colors={colors}
            delay={900}
          />
        </View>
      </Animated.View>

      {/* Bottom CTA section */}
      <Animated.View
        entering={FadeInUp.delay(700).duration(600)}
        style={[styles.ctaSection, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Urgency/Free trial banner */}
        <Animated.View
          entering={FadeInUp.delay(1000).duration(400)}
          style={[styles.trialBanner, { backgroundColor: colors.safe + '15', borderColor: colors.safe + '30' }]}
        >
          <View style={[styles.trialIcon, { backgroundColor: colors.safe }]}>
            <Text style={styles.trialIconText}>7</Text>
          </View>
          <Text style={[styles.trialText, { color: colors.foreground }]}>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>7-day free trial</Text>
            {' '}- No credit card required
          </Text>
        </Animated.View>

        {/* Primary CTA with animation */}
        <Animated.View style={ctaAnimatedStyle}>
          <Button
            onPress={onCreateAccount}
            size="lg"
            className="w-full"
          >
            <Button.Label>Start Free Trial</Button.Label>
          </Button>
        </Animated.View>

        {/* Secondary CTA */}
        <Pressable
          onPress={onContinueAsGuest}
          style={styles.guestButton}
        >
          <Text style={[styles.guestButtonText, { color: colors.mutedForeground }]}>
            {t('onboarding.signup.guest')}
          </Text>
        </Pressable>

        {/* Enhanced social proof with animated counter */}
        <Animated.View
          entering={FadeInUp.delay(1100).duration(500)}
          style={styles.socialProof}
        >
          <View style={styles.avatarStack}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(1200 + i * 80).duration(300)}
                style={[
                  styles.stackAvatar,
                  {
                    backgroundColor: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][i],
                    marginLeft: i > 0 ? -10 : 0,
                    zIndex: 5 - i,
                  },
                ]}
              >
                <Text style={styles.avatarEmoji}>
                  {['👨', '👩', '🧑', '👨‍🦱', '👩‍🦰'][i]}
                </Text>
              </Animated.View>
            ))}
          </View>
          <View style={styles.socialProofTextContainer}>
            <Text style={[styles.proofNumber, { color: colors.foreground }]}>
              {animatedCount.toLocaleString()}+
            </Text>
            <Text style={[styles.proofLabel, { color: colors.mutedForeground }]}>
              drivers trust Driwet
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Floating badge component with bounce animation
function FloatingBadge({
  delay,
  style,
  color,
  children,
}: {
  delay: number;
  style: object;
  color: string;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 150 }));

    // Floating animation
    translateY.value = withDelay(delay + 500, withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.floatingBadge, style, animatedStyle]}>
      <View style={[styles.badge, { backgroundColor: color }]}>
        {children}
      </View>
    </Animated.View>
  );
}

// Animated feature item with icon and text
function AnimatedFeatureItem({
  icon,
  text,
  highlight,
  colors,
  delay,
}: {
  icon: 'notification' | 'voice' | 'location';
  text: string;
  highlight: string;
  colors: ReturnType<typeof useThemeColors>;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400)}
      style={styles.featureItem}
    >
      <View style={[styles.featureIcon, { backgroundColor: colors.primary + '12' }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureText, { color: colors.foreground }]}>
          {text}
        </Text>
        <Text style={[styles.featureHighlight, { color: colors.primary }]}>
          {highlight}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shieldGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  shieldOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldMiddle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBadge: {
    position: 'absolute',
  },
  badgeTopLeft: {
    top: 15,
    left: 5,
  },
  badgeTopRight: {
    top: 25,
    right: 0,
  },
  badgeBottomRight: {
    bottom: 30,
    right: 10,
  },
  badgeBottomLeft: {
    bottom: 35,
    left: 15,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  featureList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  featureHighlight: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  ctaSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
  },
  trialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialIconText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  trialText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    flex: 1,
  },
  guestButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEmoji: {
    fontSize: 15,
  },
  socialProofTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  proofNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  proofLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
