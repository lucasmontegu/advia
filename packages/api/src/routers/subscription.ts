// packages/api/src/routers/subscription.ts
// Note: Subscription management is now handled via RevenueCat SDK on mobile apps.
// This router is kept as a placeholder for potential server-side subscription validation.

import { protectedProcedure } from '../index';

export const subscriptionRouter = {
  /**
   * Get subscription status placeholder.
   * With RevenueCat, subscription status is managed client-side through the SDK.
   * This endpoint can be used for server-side validation if needed in the future.
   */
  getStatus: protectedProcedure.handler(async ({ context }) => {
    // RevenueCat handles subscription state on the client side
    // Server-side validation can be added here using RevenueCat's REST API if needed
    // For now, return a placeholder response
    return {
      message: 'Subscription status is managed via RevenueCat SDK',
      userId: context.session.user.id,
    };
  }),
};
