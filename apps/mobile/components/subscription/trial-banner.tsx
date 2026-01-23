// apps/mobile/components/subscription/trial-banner.tsx
import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';
import { useIsPremium } from '@/hooks/use-subscription';
import { Icon } from '@/components/icons';

export function TrialBanner() {
  const colors = useThemeColors();
  const router = useRouter();
  const { getRemainingDays, isTrialActive, trialStartDate } = useTrialStore();
  const { isSubscribed } = useIsPremium();

  const remainingDays = getRemainingDays();
  const isLastDay = remainingDays <= 1 && remainingDays > 0;
  const isExpired = trialStartDate && remainingDays === 0 && !isSubscribed;

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
    if (isLastDay) {
      return {
        backgroundColor: colors.danger + '20',
        borderColor: colors.danger,
        textColor: colors.danger,
        icon: 'alert' as const,
        message: 'Último día de prueba',
        cta: 'Suscribirse ahora',
      };
    }
    if (remainingDays <= 3) {
      return {
        backgroundColor: colors.warning + '15',
        borderColor: colors.warning,
        textColor: colors.warning,
        icon: 'clock' as const,
        message: `${remainingDays} días restantes de prueba`,
        cta: 'Ver planes',
      };
    }
    return {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
      textColor: colors.primary,
      icon: 'star' as const,
      message: `Prueba gratis: ${remainingDays} días restantes`,
      cta: 'Ver Premium',
    };
  };

  const config = getBannerConfig();

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutUp.duration(200)}
    >
      <Pressable
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
          },
        ]}
      >
        <View style={styles.content}>
          <Icon name={config.icon} size={18} color={config.textColor} />
          <Text style={[styles.message, { color: colors.foreground }]}>
            {config.message}
          </Text>
        </View>
        <View style={styles.ctaContainer}>
          <Text style={[styles.cta, { color: config.textColor }]}>
            {config.cta}
          </Text>
          <Icon name="arrowRight" size={14} color={config.textColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  message: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
