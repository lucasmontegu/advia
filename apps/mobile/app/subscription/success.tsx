import { useRouter } from "expo-router";
import { Spinner } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";
import { useTrialStore } from "@/stores/trial-store";

type Status = "verifying" | "success" | "error";

export default function SubscriptionSuccessScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const { t } = useTranslation();
	const [status, setStatus] = useState<Status>("verifying");
	const { setPremium } = useTrialStore();
	const { refetch } = useSubscriptionStatus();

	useEffect(() => {
		async function verifySubscription() {
			try {
				// Refetch subscription status from API
				const result = await refetch();

				if (result.data?.isActive) {
					// Update local premium status
					setPremium(true);
					setStatus("success");

					// Navigate to app after showing success
					setTimeout(() => {
						router.replace("/(app)/(tabs)");
					}, 2000);
				} else {
					// Subscription not yet active, might need a moment to process
					// Retry after a short delay
					setTimeout(async () => {
						const retryResult = await refetch();
						if (retryResult.data?.isActive) {
							setPremium(true);
							setStatus("success");
							setTimeout(() => {
								router.replace("/(app)/(tabs)");
							}, 2000);
						} else {
							setStatus("error");
						}
					}, 2000);
				}
			} catch (error) {
				console.error("Error verifying subscription:", error);
				setStatus("error");
			}
		}

		verifySubscription();
	}, [refetch, setPremium, router]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 24,
				}}
			>
				{status === "verifying" && (
					<>
						<Spinner size="lg" color="primary" />
						<Text
							style={{
								fontFamily: "NunitoSans_600SemiBold",
								fontSize: 20,
								color: colors.foreground,
								marginTop: 24,
								textAlign: "center",
							}}
						>
							{t("subscription.verifying")}
						</Text>
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 16,
								color: colors.mutedForeground,
								marginTop: 8,
								textAlign: "center",
							}}
						>
							{t("subscription.pleaseWait")}
						</Text>
					</>
				)}

				{status === "success" && (
					<>
						<Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
						<Text
							style={{
								fontFamily: "NunitoSans_700Bold",
								fontSize: 28,
								color: colors.foreground,
								textAlign: "center",
							}}
						>
							{t("subscription.welcomePremium")}
						</Text>
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 16,
								color: colors.mutedForeground,
								marginTop: 8,
								textAlign: "center",
							}}
						>
							{t("subscription.enjoyFeatures")}
						</Text>
					</>
				)}

				{status === "error" && (
					<>
						<Text style={{ fontSize: 64, marginBottom: 16 }}>⚠️</Text>
						<Text
							style={{
								fontFamily: "NunitoSans_700Bold",
								fontSize: 24,
								color: colors.foreground,
								textAlign: "center",
							}}
						>
							{t("subscription.verifyError")}
						</Text>
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 16,
								color: colors.mutedForeground,
								marginTop: 8,
								textAlign: "center",
							}}
						>
							{t("subscription.contactSupport")}
						</Text>
					</>
				)}
			</View>
		</SafeAreaView>
	);
}
