// apps/native/app/_layout.tsx
import "@/global.css";
import {
	Inter_100Thin,
	Inter_300Light,
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { initAnalytics } from "@/lib/analytics";
import { getI18nInstance, I18nextProvider, setupI18n } from "@/lib/i18n";
import { asyncStoragePersister, queryClient } from "@/lib/query-client";
import { RevenueCatProvider } from "@/providers/revenuecat-provider";

// Initialize i18n before app renders (synchronous with initImmediate: false)
setupI18n();

// Initialize analytics
initAnalytics();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	initialRouteName: "(auth)",
};

function StackLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(auth)" />
			<Stack.Screen name="(app)" />
			<Stack.Screen name="subscription" />
			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
		</Stack>
	);
}

export default function Layout() {
	const [loaded, error] = useFonts({
		Inter_100Thin,
		Inter_300Light,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
	});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded && !error) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<I18nextProvider i18n={getI18nInstance()}>
				<PersistQueryClientProvider
					client={queryClient}
					persistOptions={{ persister: asyncStoragePersister }}
				>
					<LanguageProvider>
						<KeyboardProvider>
							<AppThemeProvider>
								<HeroUINativeProvider>
									<RevenueCatProvider>
										<NotificationsProvider>
											<StackLayout />
										</NotificationsProvider>
									</RevenueCatProvider>
								</HeroUINativeProvider>
							</AppThemeProvider>
						</KeyboardProvider>
					</LanguageProvider>
				</PersistQueryClientProvider>
			</I18nextProvider>
		</GestureHandlerRootView>
	);
}
