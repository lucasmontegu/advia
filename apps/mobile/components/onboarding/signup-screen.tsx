// apps/mobile/components/onboarding/signup-screen.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { Icon } from '@/components/icons';

type SignupScreenProps = {
  onCreateAccount: () => void;
  onContinueAsGuest: () => void;
  driverCount?: number;
};

export function SignupScreen({
  onCreateAccount,
  onContinueAsGuest,
  driverCount = 10000,
}: SignupScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top section with illustration */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={[styles.topSection, { paddingTop: insets.top + 40 }]}
      >
        {/* Safety shield illustration */}
        <View style={[styles.illustrationContainer, { backgroundColor: colors.primary + '10' }]}>
          <View style={[styles.shieldOuter, { backgroundColor: colors.primary + '20' }]}>
            <View style={[styles.shieldInner, { backgroundColor: colors.primary }]}>
              <Icon name="storm" size={48} color="#FFFFFF" />
            </View>
          </View>

          {/* Floating badges around shield */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            style={[styles.floatingBadge, styles.badgeTopLeft]}
          >
            <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.badgeText}>✓</Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(500).duration(500)}
            style={[styles.floatingBadge, styles.badgeTopRight]}
          >
            <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
              <Icon name="weather" size={14} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(600).duration(500)}
            style={[styles.floatingBadge, styles.badgeBottom]}
          >
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Icon name="route" size={14} color="#FFFFFF" />
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Content section */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        style={styles.contentSection}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('onboarding.signup.title')}
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          <FeatureItem
            icon="notification"
            text="Real-time weather alerts"
            colors={colors}
          />
          <FeatureItem
            icon="voice"
            text="Voice co-pilot during drives"
            colors={colors}
          />
          <FeatureItem
            icon="location"
            text="Safe stop recommendations"
            colors={colors}
          />
        </View>
      </Animated.View>

      {/* Bottom CTA section */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(600)}
        style={[styles.ctaSection, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Primary CTA */}
        <Button
          onPress={onCreateAccount}
          size="lg"
          className="w-full"
        >
          <Button.Label>{t('onboarding.signup.cta')}</Button.Label>
        </Button>

        {/* Secondary CTA */}
        <Pressable
          onPress={onContinueAsGuest}
          style={styles.guestButton}
        >
          <Text style={[styles.guestButtonText, { color: colors.mutedForeground }]}>
            {t('onboarding.signup.guest')}
          </Text>
        </Pressable>

        {/* Social proof */}
        <View style={styles.socialProof}>
          <View style={styles.avatarStack}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.stackAvatar,
                  { backgroundColor: colors.primary, marginLeft: i > 0 ? -8 : 0 },
                ]}
              >
                <Text style={styles.avatarEmoji}>
                  {['👨', '👩', '🧑', '👨‍🦱'][i]}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.socialProofText}>
            <Icon name="notification" size={14} color="#F59E0B" />
            <Text style={[styles.proofText, { color: colors.mutedForeground }]}>
              {t('onboarding.signup.socialProof', { count: driverCount })}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

type FeatureItemProps = {
  icon: 'notification' | 'voice' | 'location';
  text: string;
  colors: ReturnType<typeof useThemeColors>;
};

function FeatureItem({ icon, text, colors }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.featureText, { color: colors.foreground }]}>
        {text}
      </Text>
    </View>
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
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shieldOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
    top: 20,
    left: 10,
  },
  badgeTopRight: {
    top: 30,
    right: 5,
  },
  badgeBottom: {
    bottom: 25,
    right: 20,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 32,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    flex: 1,
  },
  ctaSection: {
    paddingHorizontal: 24,
    gap: 16,
  },
  guestButton: {
    paddingVertical: 12,
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
    gap: 12,
    marginTop: 8,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEmoji: {
    fontSize: 14,
  },
  socialProofText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proofText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
