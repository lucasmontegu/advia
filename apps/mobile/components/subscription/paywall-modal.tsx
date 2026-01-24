// apps/mobile/components/subscription/paywall-modal.tsx
// Simplified paywall that uses RevenueCat's native UI
import { useEffect } from 'react';
import { useSubscriptionCheckout, useIsPremium } from '@/hooks/use-subscription';

type PaywallModalProps = {
  visible: boolean;
  onDismiss?: () => void;
  allowDismiss?: boolean;
};

/**
 * PaywallModal - Presents RevenueCat's native paywall UI
 *
 * This component has been simplified to use RevenueCat's native paywall
 * instead of a custom UI. RevenueCat handles:
 * - Displaying pricing and plans
 * - Purchase flow
 * - Restore purchases
 * - Error handling
 * - App Store compliance
 */
export function PaywallModal({
  visible,
  onDismiss,
  allowDismiss = true,
}: PaywallModalProps) {
  const { checkout, isLoading } = useSubscriptionCheckout();
  const { isSubscribed } = useIsPremium();

  // Auto-dismiss when subscription becomes active
  useEffect(() => {
    if (isSubscribed && visible) {
      onDismiss?.();
    }
  }, [isSubscribed, visible, onDismiss]);

  // Present RevenueCat paywall when modal becomes visible
  useEffect(() => {
    if (!visible || isLoading) return;

    const presentPaywall = async () => {
      const success = await checkout();

      // Always call onDismiss after paywall closes
      // (user either subscribed, cancelled, or closed)
      if (allowDismiss || success) {
        onDismiss?.();
      }
    };

    presentPaywall();
  }, [visible, checkout, onDismiss, allowDismiss, isLoading]);

  // This component doesn't render anything visible
  // RevenueCat presents its own native modal UI
  return null;
}
