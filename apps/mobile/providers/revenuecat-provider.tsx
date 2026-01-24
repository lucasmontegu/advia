// apps/mobile/providers/revenuecat-provider.tsx
// RevenueCat context provider for managing subscription state across the app

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesOffering,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  initializeRevenueCat,
  identifyUser,
  logoutUser,
  restorePurchases,
  ENTITLEMENTS,
} from '@/lib/revenuecat';

// Types
interface RevenueCatContextValue {
  // State
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOffering | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  // Computed
  isProUser: boolean;
  activeSubscription: string | null;
  expirationDate: string | null;

  // Actions
  refreshCustomerInfo: () => Promise<void>;
  identifyUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  presentPaywall: (options?: PaywallOptions) => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  presentCustomerCenter: () => Promise<void>;
}

interface PaywallOptions {
  offering?: PurchasesOffering;
  displayCloseButton?: boolean;
}

interface RevenueCatProviderProps {
  children: ReactNode;
}

// Context
const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

// Provider Component
export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize SDK and load initial data
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize RevenueCat SDK
        await initializeRevenueCat();

        // Load initial customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Load offerings
        const fetchedOfferings = await Purchases.getOfferings();
        setOfferings(fetchedOfferings);

        setIsInitialized(true);
        console.log('[RevenueCat] Provider initialized');
      } catch (err) {
        console.error('[RevenueCat] Initialization error:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize RevenueCat'));
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Set up customer info listener for real-time updates
  useEffect(() => {
    const listener = (info: CustomerInfo) => {
      console.log('[RevenueCat] Customer info updated');
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  // Computed values
  const isProUser = useMemo(() => {
    if (!customerInfo) return false;
    return !!customerInfo.entitlements.active[ENTITLEMENTS.PRO]?.isActive;
  }, [customerInfo]);

  const activeSubscription = useMemo(() => {
    if (!customerInfo) return null;
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    return proEntitlement?.productIdentifier ?? null;
  }, [customerInfo]);

  const expirationDate = useMemo(() => {
    if (!customerInfo) return null;
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    return proEntitlement?.expirationDate ?? null;
  }, [customerInfo]);

  const currentOffering = useMemo(() => {
    return offerings?.current ?? null;
  }, [offerings]);

  // Actions
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error('[RevenueCat] Failed to refresh customer info:', err);
      throw err;
    }
  }, []);

  const handleIdentifyUser = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      await identifyUser(userId);
      await refreshCustomerInfo();
    } catch (err) {
      console.error('[RevenueCat] Failed to identify user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCustomerInfo]);

  const handleLogoutUser = useCallback(async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      await refreshCustomerInfo();
    } catch (err) {
      console.error('[RevenueCat] Failed to logout user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCustomerInfo]);

  const handleRestorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const hasProAccess = await restorePurchases();
      await refreshCustomerInfo();
      return hasProAccess;
    } catch (err) {
      console.error('[RevenueCat] Failed to restore purchases:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCustomerInfo]);

  const presentPaywall = useCallback(async (options?: PaywallOptions): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywall({
        offering: options?.offering,
        displayCloseButton: options?.displayCloseButton ?? true,
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
          console.log('[RevenueCat] User made a purchase');
          return true;
        case PAYWALL_RESULT.RESTORED:
          console.log('[RevenueCat] User restored purchases');
          return true;
        case PAYWALL_RESULT.CANCELLED:
          console.log('[RevenueCat] User cancelled');
          return false;
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('[RevenueCat] Paywall not presented');
          return false;
        case PAYWALL_RESULT.ERROR:
          console.log('[RevenueCat] Paywall error');
          return false;
        default:
          return false;
      }
    } catch (err) {
      console.error('[RevenueCat] Paywall error:', err);
      throw err;
    }
  }, []);

  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENTS.PRO,
      });

      if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        console.log('[RevenueCat] User already has Pro access');
        return true; // Already has access
      }

      return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
    } catch (err) {
      console.error('[RevenueCat] Paywall if needed error:', err);
      throw err;
    }
  }, []);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onShowingManageSubscriptions: () => {
            console.log('[RevenueCat] Showing manage subscriptions');
          },
          onRestoreStarted: () => {
            console.log('[RevenueCat] Restore started');
          },
          onRestoreCompleted: ({ customerInfo: info }) => {
            console.log('[RevenueCat] Restore completed');
            setCustomerInfo(info);
          },
          onRestoreFailed: ({ error: err }) => {
            console.error('[RevenueCat] Restore failed:', err);
          },
        },
      });
    } catch (err) {
      console.error('[RevenueCat] Customer center error:', err);
      throw err;
    }
  }, []);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      // State
      customerInfo,
      offerings,
      currentOffering,
      isLoading,
      isInitialized,
      error,

      // Computed
      isProUser,
      activeSubscription,
      expirationDate,

      // Actions
      refreshCustomerInfo,
      identifyUser: handleIdentifyUser,
      logoutUser: handleLogoutUser,
      restorePurchases: handleRestorePurchases,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
    }),
    [
      customerInfo,
      offerings,
      currentOffering,
      isLoading,
      isInitialized,
      error,
      isProUser,
      activeSubscription,
      expirationDate,
      refreshCustomerInfo,
      handleIdentifyUser,
      handleLogoutUser,
      handleRestorePurchases,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
    ]
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

// Hook to use RevenueCat context
export function useRevenueCat(): RevenueCatContextValue {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
