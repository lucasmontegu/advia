// apps/native/app/(app)/login-incentive.tsx

import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useOAuthAuth } from "@/hooks/use-oauth-auth";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

export default function LoginIncentiveModal() {
	const colors = useThemeColors();
	const router = useRouter();
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState<"google" | "apple" | null>(null);

	// Close modal after successful auth instead of navigating to home
	const handleAuthSuccess = useCallback(() => {
		router.back();
	}, [router]);

	const { signInWithGoogle, signInWithApple } = useOAuthAuth({
		onSuccess: handleAuthSuccess,
		navigateToHome: false,
	});

	const handleGoogleSignIn = async () => {
		setIsLoading("google");
		try {
			await signInWithGoogle();
		} catch {
			// Error already logged in hook
		} finally {
			setIsLoading(null);
		}
	};

	const handleAppleSignIn = async () => {
		setIsLoading("apple");
		try {
			await signInWithApple();
		} catch {
			// Error already logged in hook
		} finally {
			setIsLoading(null);
		}
	};

	const handleEmailSignIn = () => {
		router.push("/(auth)/email-input");
	};

	const handleSkip = () => {
		router.back();
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<View style={{ flex: 1, padding: 24 }}>
				{/* Close button */}
				<Pressable
					onPress={() => router.back()}
					style={{ alignSelf: "flex-end", padding: 8 }}
				>
					<Icon name="close" size={24} color={colors.mutedForeground} />
				</Pressable>

				{/* Content */}
				<View
					style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
				>
					{/* Icon */}
					<View style={{ marginBottom: 24 }}>
						<Icon name="lock" size={64} color={colors.primary} />
					</View>

					{/* Title */}
					<Text
						style={{
							fontFamily: "NunitoSans_700Bold",
							fontSize: 24,
							color: colors.foreground,
							textAlign: "center",
							marginBottom: 12,
						}}
					>
						{t("loginIncentive.title")}
					</Text>

					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 16,
							color: colors.mutedForeground,
							textAlign: "center",
							marginBottom: 32,
							lineHeight: 24,
							paddingHorizontal: 16,
						}}
					>
						{t("loginIncentive.subtitle")}
					</Text>

					{/* Auth buttons */}
					<View style={{ width: "100%", gap: 12 }}>
						<Button
							onPress={handleGoogleSignIn}
							variant="secondary"
							size="lg"
							isDisabled={isLoading !== null}
						>
							<Button.Label>
								{isLoading === "google"
									? t("auth.connecting")
									: t("auth.continueWithGoogle")}
							</Button.Label>
						</Button>

						<Button
							onPress={handleAppleSignIn}
							variant="secondary"
							size="lg"
							isDisabled={isLoading !== null}
						>
							<Button.Label>
								{isLoading === "apple"
									? t("auth.connecting")
									: t("auth.continueWithApple")}
							</Button.Label>
						</Button>

						<Button onPress={handleEmailSignIn} variant="ghost" size="lg">
							<Button.Label>{t("auth.continueWithEmail")}</Button.Label>
						</Button>
					</View>
				</View>

				{/* Skip option */}
				<Pressable
					onPress={handleSkip}
					style={{ alignItems: "center", paddingVertical: 16 }}
				>
					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							color: colors.mutedForeground,
						}}
					>
						{t("loginIncentive.continueWithoutAccount")}
					</Text>
					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							color: colors.mutedForeground,
							fontSize: 12,
						}}
					>
						{t("loginIncentive.localDataOnly")}
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
