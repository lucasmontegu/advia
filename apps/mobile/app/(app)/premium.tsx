// apps/mobile/app/(app)/premium.tsx
// Premium screen with RevenueCat integration
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import {
  useSubscriptionCheckout,
  useSubscriptionManagement,
  useIsPremium,
  useSubscriptionDetails,
} from '@/hooks/use-subscription';
import { Icon } from '@/components/icons';

export default function PremiumScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { checkout, isLoading: isCheckoutLoading } = useSubscriptionCheckout();
  const { openManagement, restore, isLoading: isManagementLoading } = useSubscriptionManagement();
  const { isSubscribed, isPremium } = useIsPremium();
  const { activeSubscription, expirationDate } = useSubscriptionDetails();
  const [isRestoring, setIsRestoring] = useState(false);

  const features = [
    t('premium.features.unlimitedRoutes'),
    t('premium.features.realTimeAlerts'),
    t('premium.features.noAds'),
    t('premium.features.refugeLocations'),
    t('premium.features.fullHistory'),
    t('premium.features.multipleLocations'),
  ];

  const handleSubscribe = async () => {
    await checkout();
  };

  const handleManageSubscription = async () => {
    await openManagement();
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      await restore();
    } finally {
      setIsRestoring(false);
    }
  };

  const isLoading = isCheckoutLoading || isManagementLoading || isRestoring;

  // Format expiration date for display
  const formatExpirationDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, alignItems: 'center' }}
      >
        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-end', padding: 8 }}
        >
          <Icon name="close" size={24} color={colors.mutedForeground} />
        </Pressable>

        {/* Header */}
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⭐</Text>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          {t('premium.title')}
        </Text>

        {/* Current plan badge */}
        {isSubscribed && (
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 14,
                color: colors.primaryForeground,
              }}
            >
              Driwet Pro
            </Text>
          </View>
        )}

        {/* Expiration date */}
        {isSubscribed && expirationDate && (
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: colors.mutedForeground,
              marginBottom: 24,
            }}
          >
            {t('subscription.renewsOn', { date: formatExpirationDate(expirationDate) })}
          </Text>
        )}

        {!isSubscribed && <View style={{ height: 24 }} />}

        {/* Features */}
        <View style={{ width: '100%', marginBottom: 32 }}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Icon name="check" size={18} color={colors.safe} />
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 16,
                  color: colors.foreground,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        {isSubscribed ? (
          <View style={{ width: '100%', gap: 12 }}>
            <Button
              onPress={handleManageSubscription}
              size="lg"
              className="w-full"
              isDisabled={isLoading}
            >
              <Button.Label>
                {isManagementLoading ? t('common.loading') : t('subscription.manageSubscription')}
              </Button.Label>
            </Button>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 12 }}>
            {/* Subscribe button - opens RevenueCat native paywall */}
            <Button
              onPress={handleSubscribe}
              size="lg"
              className="w-full"
              isDisabled={isLoading}
            >
              <Button.Label>
                {isCheckoutLoading ? t('common.loading') : t('premium.subscribe')}
              </Button.Label>
            </Button>

            {/* Restore purchases */}
            <Button
              onPress={handleRestorePurchases}
              variant="secondary"
              size="lg"
              className="w-full"
              isDisabled={isLoading}
            >
              <Button.Label>
                {isRestoring ? t('common.loading') : t('subscription.restorePurchases')}
              </Button.Label>
            </Button>
          </View>
        )}

        {/* Footer */}
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          {t('premium.cancelAnytime')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
