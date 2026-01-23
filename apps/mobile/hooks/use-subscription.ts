import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Linking } from 'react-native';
import { api } from '@/lib/query-client';
import { useTrialStore } from '@/stores/trial-store';
import { env } from '@driwet/env/mobile';

export function useSubscriptionStatus() {
  const { setPremium } = useTrialStore();

  const query = useQuery({
    ...api.subscription.getStatus.queryOptions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Sync with trial store when subscription status changes
  useEffect(() => {
    if (query.data) {
      setPremium(query.data.isActive);
    }
  }, [query.data, setPremium]);

  return query;
}

export function useSubscriptionCheckout() {
  const handleCheckout = useCallback(async (plan: 'monthly' | 'yearly') => {
    try {
      // Open web-based Polar checkout
      // This will redirect to the Polar checkout page
      const checkoutUrl = `${env.EXPO_PUBLIC_SERVER_URL}/api/subscription/checkout?plan=${plan}`;
      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
      } else {
        throw new Error('Cannot open checkout URL');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }, []);

  const handlePortal = useCallback(async () => {
    try {
      // Open the customer portal to manage subscription
      const portalUrl = `${env.EXPO_PUBLIC_SERVER_URL}/api/subscription/portal`;
      const canOpen = await Linking.canOpenURL(portalUrl);
      if (canOpen) {
        await Linking.openURL(portalUrl);
      } else {
        throw new Error('Cannot open portal URL');
      }
    } catch (error) {
      console.error('Portal error:', error);
      throw error;
    }
  }, []);

  return {
    checkout: handleCheckout,
    portal: handlePortal,
  };
}

export function useIsPremium() {
  const { isPremium, isTrialActive, checkTrialStatus } = useTrialStore();
  const { data: subscription, isLoading } = useSubscriptionStatus();

  // Check trial status on mount
  useEffect(() => {
    checkTrialStatus();
  }, [checkTrialStatus]);

  // User has premium access if:
  // 1. They have an active subscription, OR
  // 2. They are in trial period
  const hasPremiumAccess = subscription?.isActive || isTrialActive || isPremium;

  return {
    isPremium: hasPremiumAccess,
    isSubscribed: subscription?.isActive ?? false,
    plan: subscription?.plan ?? null,
    isLoading,
  };
}
