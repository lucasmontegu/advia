import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	// Note: Subscriptions are now handled via RevenueCat SDK on the mobile app
});

// User preference types (matching server-side additionalFields)
export type ThemePreference = "light" | "dark" | "auto";
export type LanguagePreference = "en" | "es";

export interface UserPreferences {
	theme: ThemePreference;
	language: LanguagePreference;
	notificationsEnabled: boolean;
}

// Re-export session hook
export const useSession = authClient.useSession;
