// apps/mobile/components/subscription/trial-banner.tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';
import { useIsPremium } from '@/hooks/use-subscription';
import { Icon } from '@/components/icons';

// Hook for countdown timer
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export function TrialBanner() {
  const colors = useThemeColors();
  const router = useRouter();
  const { getRemainingDays, isTrialActive, trialStartDate, trialEndDate } = useTrialStore();
  const { isSubscribed } = useIsPremium();

  const remainingDays = getRemainingDays();
  const isLastDay = remainingDays <= 1 && remainingDays > 0;
  const isLastHours = remainingDays === 0; // Less than 24 hours
  const isExpired = trialStartDate && remainingDays === 0 && !isSubscribed;

  // Countdown for urgency
  const countdown = useCountdown(trialEndDate);

  // Animation values for urgency
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (isLastDay || isLastHours) {
      // Urgent pulsing animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.4, { duration: 800 })
        ),
        -1
      );
    }
  }, [isLastDay, isLastHours]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = useCallback(() => {
    router.push('/premium');
  }, [router]);

  // Don't show if:
  // - User is subscribed
  // - Trial hasn't started
  // - Trial is expired (will show paywall instead)
  if (isSubscribed || !trialStartDate || isExpired) {
    return null;
  }

  // Don't show if trial is no longer active and not expired
  if (!isTrialActive && !isExpired) {
    return null;
  }

  const getBannerConfig = () => {
    if (isLastHours) {
      return {
        type: 'critical' as const,
        backgroundColor: '#EF4444',
        gradientColors: ['#EF4444', '#DC2626'] as const,
        textColor: '#FFFFFF',
        icon: 'alert' as const,
        showCountdown: true,
      };
    }
    if (isLastDay) {
      return {
        type: 'urgent' as const,
        backgroundColor: colors.danger,
        gradientColors: [colors.danger, '#DC2626'] as const,
        textColor: '#FFFFFF',
        icon: 'clock' as const,
        showCountdown: true,
      };
    }
    if (remainingDays <= 3) {
      return {
        type: 'warning' as const,
        backgroundColor: colors.warning,
        gradientColors: [colors.warning, '#D97706'] as const,
        textColor: '#FFFFFF',
        icon: 'clock' as const,
        showCountdown: false,
      };
    }
    return {
      type: 'normal' as const,
      backgroundColor: colors.primary,
      gradientColors: [colors.primary, '#4F46E5'] as const,
      textColor: '#FFFFFF',
      icon: 'star' as const,
      showCountdown: false,
    };
  };

  const config = getBannerConfig();

  // Format countdown display
  const formatCountdownUnit = (value: number) => value.toString().padStart(2, '0');

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutUp.duration(200)}
    >
      <Pressable onPress={handlePress}>
        <Animated.View style={pulseStyle}>
          <LinearGradient
            colors={config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.container}
          >
            {/* Glow effect for urgent states */}
            {(isLastDay || isLastHours) && (
              <Animated.View
                style={[
                  styles.glowOverlay,
                  { backgroundColor: '#FFFFFF' },
                  glowStyle,
                ]}
              />
            )}

            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Icon name={config.icon} size={18} color={config.textColor} />
              </View>

              <View style={styles.textContainer}>
                {config.showCountdown ? (
                  <>
                    <Text style={[styles.urgentLabel, { color: config.textColor }]}>
                      {isLastHours ? 'Trial ends in' : 'Last day of trial!'}
                    </Text>
                    <View style={styles.countdown}>
                      <CountdownUnit value={countdown.hours} label="hrs" color={config.textColor} />
                      <Text style={[styles.countdownSeparator, { color: config.textColor }]}>:</Text>
                      <CountdownUnit value={countdown.minutes} label="min" color={config.textColor} />
                      <Text style={[styles.countdownSeparator, { color: config.textColor }]}>:</Text>
                      <CountdownUnit value={countdown.seconds} label="sec" color={config.textColor} />
                    </View>
                  </>
                ) : (
                  <Text style={[styles.message, { color: config.textColor }]}>
                    {remainingDays <= 3
                      ? `${remainingDays} days left in trial`
                      : `Free trial: ${remainingDays} days remaining`}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.ctaButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.ctaText, { color: config.textColor }]}>
                {isLastHours || isLastDay ? 'Upgrade' : 'View'}
              </Text>
              <Icon name="arrowRight" size={12} color={config.textColor} />
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Countdown unit component
function CountdownUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.countdownUnit}>
      <Text style={[styles.countdownValue, { color }]}>
        {value.toString().padStart(2, '0')}
      </Text>
      <Text style={[styles.countdownLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  urgentLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 2,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 28,
  },
  countdownValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  countdownLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    opacity: 0.8,
    marginTop: -2,
  },
  countdownSeparator: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginHorizontal: 2,
    marginBottom: 10,
  },
  message: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
