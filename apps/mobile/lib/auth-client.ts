import { expoClient } from "@better-auth/expo/client";
import { env } from "@driwet/env/mobile";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: env.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
		}),
	],
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
