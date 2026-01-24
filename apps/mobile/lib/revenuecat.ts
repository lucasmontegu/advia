// apps/mobile/lib/revenuecat.ts
// RevenueCat SDK configuration and initialization

import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

// API Keys - Use the same key for both platforms in test mode
// In production, you may have different keys for iOS and Android
const API_KEYS = {
  ios: 'test_OaTiNtcxomTjHdkELizgAHplwFP',
  android: 'test_OaTiNtcxomTjHdkELizgAHplwFP',
} as const;

// Entitlement identifiers - must match RevenueCat dashboard
export const ENTITLEMENTS = {
  PRO: 'Driwet Pro',
} as const;

// Product identifiers - must match App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const;

// Offering identifiers
export const OFFERING_IDS = {
  DEFAULT: 'default',
} as const;

/**
 * Initialize RevenueCat SDK
 * Call this once at app startup, before any other RevenueCat calls
 */
export async function initializeRevenueCat(): Promise<void> {
  const apiKey = Platform.select({
    ios: API_KEYS.ios,
    android: API_KEYS.android,
    default: API_KEYS.ios,
  });

  if (!apiKey) {
    console.error('[RevenueCat] No API key found for platform:', Platform.OS);
    return;
  }

  // Set log level - use DEBUG for development, WARN for production
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);

  try {
    await Purchases.configure({ apiKey });
    console.log('[RevenueCat] SDK initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Failed to initialize SDK:', error);
    throw error;
  }
}

/**
 * Identify a user with RevenueCat
 * Call this when user logs in to link their purchases across devices
 * @param userId - Your app's user ID (e.g., from Better Auth)
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User identified:', userId);
    return;
  } catch (error) {
    console.error('[RevenueCat] Failed to identify user:', error);
    throw error;
  }
}

/**
 * Log out the current user
 * Creates an anonymous user - useful when user logs out of your app
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out, now anonymous');
  } catch (error) {
    console.error('[RevenueCat] Failed to logout user:', error);
    throw error;
  }
}

/**
 * Restore purchases for the current user
 * Use when user reinstalls app or switches devices
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasProEntitlement = !!customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    console.log('[RevenueCat] Purchases restored, has Pro:', hasProEntitlement);
    return hasProEntitlement;
  } catch (error) {
    console.error('[RevenueCat] Failed to restore purchases:', error);
    throw error;
  }
}

/**
 * Check if user has an active Pro entitlement
 */
export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return !!customerInfo.entitlements.active[ENTITLEMENTS.PRO]?.isActive;
}
