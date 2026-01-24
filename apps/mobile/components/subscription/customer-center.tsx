// apps/mobile/components/subscription/customer-center.tsx
// Customer Center button component for subscription management
import { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useSubscriptionManagement, useIsPremium } from '@/hooks/use-subscription';
import { Icon } from '@/components/icons';

type CustomerCenterButtonProps = {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

/**
 * CustomerCenterButton - Opens RevenueCat's Customer Center
 *
 * The Customer Center provides:
 * - Subscription details
 * - Cancel/change subscription
 * - Restore purchases
 * - Contact support
 */
export function CustomerCenterButton({
  showLabel = true,
  size = 'md',
}: CustomerCenterButtonProps) {
  const colors = useThemeColors();
  const { openManagement, isLoading: contextLoading } = useSubscriptionManagement();
  const { isSubscribed } = useIsPremium();
  const [isOpening, setIsOpening] = useState(false);

  const handlePress = useCallback(async () => {
    setIsOpening(true);
    try {
      await openManagement();
    } finally {
      setIsOpening(false);
    }
  }, [openManagement]);

  const isLoading = contextLoading || isOpening;

  // Size configurations
  const sizeConfig = {
    sm: { padding: 8, iconSize: 18, fontSize: 13 },
    md: { padding: 12, iconSize: 20, fontSize: 14 },
    lg: { padding: 16, iconSize: 24, fontSize: 16 },
  };

  const config = sizeConfig[size];

  // Only show if user has a subscription
  if (!isSubscribed) return null;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      style={[
        styles.button,
        {
          backgroundColor: colors.muted,
          padding: config.padding,
          opacity: isLoading ? 0.7 : 1,
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Icon name="settings" size={config.iconSize} color={colors.foreground} />
      )}
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: colors.foreground, fontSize: config.fontSize },
          ]}
        >
          Gestionar suscripción
        </Text>
      )}
    </Pressable>
  );
}

/**
 * RestorePurchasesButton - Restores previous purchases
 */
export function RestorePurchasesButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const colors = useThemeColors();
  const { restore, isLoading: contextLoading } = useSubscriptionManagement();
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePress = useCallback(async () => {
    setIsRestoring(true);
    try {
      await restore();
    } finally {
      setIsRestoring(false);
    }
  }, [restore]);

  const isLoading = contextLoading || isRestoring;

  const sizeConfig = {
    sm: { padding: 8, fontSize: 13 },
    md: { padding: 12, fontSize: 14 },
    lg: { padding: 16, fontSize: 16 },
  };

  const config = sizeConfig[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      style={[
        styles.restoreButton,
        {
          padding: config.padding,
          opacity: isLoading ? 0.7 : 1,
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.restoreLabel, { color: colors.primary, fontSize: config.fontSize }]}>
          Restaurar compras
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
  },
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreLabel: {
    fontFamily: 'Inter_600SemiBold',
  },
});
