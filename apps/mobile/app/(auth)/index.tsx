// apps/mobile/app/(auth)/index.tsx

import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { isNewOnboardingComplete } from "@/components/onboarding";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function AuthIndex() {
	const colors = useThemeColors();
	const [redirectTo, setRedirectTo] = useState<"onboarding" | "welcome" | null>(
		null,
	);
	const hasChecked = useRef(false);

	useEffect(() => {
		// Only check once on mount to prevent race conditions
		if (hasChecked.current) return;
		hasChecked.current = true;

		let isMounted = true;

		const checkOnboarding = async () => {
			try {
				const completed = await isNewOnboardingComplete();

				if (isMounted) {
					setRedirectTo(completed ? "welcome" : "onboarding");
				}
			} catch (error) {
				console.error("Failed to check onboarding status:", error);
				// On error, proceed to welcome screen
				if (isMounted) {
					setRedirectTo("welcome");
				}
			}
		};

		checkOnboarding();

		return () => {
			isMounted = false;
		};
	}, []);

	// Show loading indicator while checking onboarding status
	if (!redirectTo) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colors.background,
				}}
			>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	// Redirect to the appropriate screen
	return <Redirect href={`/(auth)/${redirectTo}`} />;
}
