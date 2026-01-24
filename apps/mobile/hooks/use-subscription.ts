// apps/mobile/hooks/use-subscription.ts
// Subscription hooks using RevenueCat

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRevenueCat } from '@/providers/revenuecat-provider';
import { useTrialStore } from '@/stores/trial-store';

/**
 * Hook to check if user has premium access
 * Premium access is granted if:
 * 1. User has an active RevenueCat subscription (Driwet Pro entitlement)
 * 2. User is in trial period
 */
export function useIsPremium() {
  const { isProUser, isLoading, activeSubscription } = useRevenueCat();
  const { isTrialActive } = useTrialStore();

  // User has premium access if subscribed OR in trial
  const isPremium = isProUser || isTrialActive;

  return {
    isPremium,
    isSubscribed: isProUser,
    plan: activeSubscription,
    isLoading,
  };
}

/**
 * Hook for subscription checkout actions
 * Uses RevenueCat's native paywall UI
 */
export function useSubscriptionCheckout() {
  const { presentPaywall, presentPaywallIfNeeded, isLoading } = useRevenueCat();

  const checkout = useCallback(async (): Promise<boolean> => {
    try {
      const success = await presentPaywall({
        displayCloseButton: true,
      });
      return success;
    } catch (error) {
      console.error('[Subscription] Checkout error:', error);
      Alert.alert(
        'Error',
        'No se pudo iniciar el proceso de pago. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [presentPaywall]);

  const checkoutIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      const success = await presentPaywallIfNeeded();
      return success;
    } catch (error) {
      console.error('[Subscription] Checkout if needed error:', error);
      return false;
    }
  }, [presentPaywallIfNeeded]);

  return {
    checkout,
    checkoutIfNeeded,
    isLoading,
  };
}

/**
 * Hook for subscription management (portal/customer center)
 */
export function useSubscriptionManagement() {
  const { presentCustomerCenter, restorePurchases, isLoading } = useRevenueCat();

  const openManagement = useCallback(async () => {
    try {
      await presentCustomerCenter();
    } catch (error) {
      console.error('[Subscription] Management error:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir la gestión de suscripción.',
        [{ text: 'OK' }]
      );
    }
  }, [presentCustomerCenter]);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const hasAccess = await restorePurchases();
      if (hasAccess) {
        Alert.alert(
          'Compras restauradas',
          'Tus compras han sido restauradas exitosamente.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sin compras',
          'No se encontraron compras previas para restaurar.',
          [{ text: 'OK' }]
        );
      }
      return hasAccess;
    } catch (error) {
      console.error('[Subscription] Restore error:', error);
      Alert.alert(
        'Error',
        'No se pudieron restaurar las compras. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [restorePurchases]);

  return {
    openManagement,
    restore,
    isLoading,
  };
}

/**
 * Hook to get subscription details
 */
export function useSubscriptionDetails() {
  const {
    customerInfo,
    currentOffering,
    activeSubscription,
    expirationDate,
    isProUser,
  } = useRevenueCat();

  return {
    customerInfo,
    currentOffering,
    activeSubscription,
    expirationDate,
    isProUser,
    // Packages from current offering
    packages: currentOffering?.availablePackages ?? [],
    monthlyPackage: currentOffering?.monthly ?? null,
    yearlyPackage: currentOffering?.annual ?? null,
    lifetimePackage: currentOffering?.lifetime ?? null,
  };
}
