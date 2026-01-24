import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
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

// Helper to get session token from SecureStore
async function getSessionToken(): Promise<string | null> {
  try {
    const scheme = Constants.expoConfig?.scheme as string;
    const tokenKey = `${scheme}_better-auth.session_token`;
    const token = await SecureStore.getItemAsync(tokenKey);
    return token;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

export function useSubscriptionCheckout() {
  const handleCheckout = useCallback(async (plan: 'monthly' | 'yearly') => {
    try {
      // Get the session token to pass to the checkout endpoint
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      // Build checkout URL with session token
      const scheme = Constants.expoConfig?.scheme as string;
      const checkoutUrl = `${env.EXPO_PUBLIC_SERVER_URL}/api/subscription/checkout?plan=${plan}&token=${encodeURIComponent(sessionToken)}`;
      const returnUrl = `${scheme}://subscription/success`;

      // Use WebBrowser.openAuthSessionAsync for better handling of auth flows
      // This will open the checkout in an in-app browser and handle the deep link return
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

      if (result.type === 'cancel') {
        console.log('Checkout cancelled by user');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }, []);

  const handlePortal = useCallback(async () => {
    try {
      // Get the session token to pass to the portal endpoint
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      // Build portal URL with session token
      const scheme = Constants.expoConfig?.scheme as string;
      const portalUrl = `${env.EXPO_PUBLIC_SERVER_URL}/api/subscription/portal?token=${encodeURIComponent(sessionToken)}`;
      const returnUrl = `${scheme}://`;

      // Use WebBrowser.openAuthSessionAsync for portal access
      await WebBrowser.openAuthSessionAsync(portalUrl, returnUrl);
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
