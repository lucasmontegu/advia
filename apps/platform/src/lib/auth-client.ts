import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Note: Subscriptions are now handled via RevenueCat SDK on the mobile app
});
