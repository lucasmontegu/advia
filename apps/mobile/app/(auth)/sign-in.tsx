// apps/native/app/(auth)/sign-in.tsx

import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOAuthAuth } from "@/hooks/use-oauth-auth";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

export default function SignInScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState<"google" | "apple" | null>(null);
	const { signInWithGoogle, signInWithApple } = useOAuthAuth();

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

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<View className="flex-1 px-6 pt-8">
				{/* Header */}
				<Text
					style={{
						fontFamily: "NunitoSans_700Bold",
						fontSize: 28,
						color: colors.foreground,
						marginBottom: 8,
					}}
				>
					{t("auth.signInTitle")}
				</Text>

				<Text
					style={{
						fontFamily: "NunitoSans_400Regular",
						fontSize: 16,
						color: colors.mutedForeground,
						marginBottom: 32,
						lineHeight: 24,
					}}
				>
					{t("auth.signInSubtitle")}
				</Text>

				{/* Social buttons */}
				<View className="gap-3">
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
				</View>

				{/* Divider */}
				<View className="my-6 flex-row items-center">
					<View
						style={{ flex: 1, height: 1, backgroundColor: colors.border }}
					/>
					<Text
						style={{
							marginHorizontal: 16,
							color: colors.mutedForeground,
							fontFamily: "NunitoSans_400Regular",
						}}
					>
						{t("common.or")}
					</Text>
					<View
						style={{ flex: 1, height: 1, backgroundColor: colors.border }}
					/>
				</View>

				{/* Email option */}
				<Button onPress={handleEmailSignIn} variant="ghost" size="lg">
					<Button.Label>{t("auth.continueWithEmail")}</Button.Label>
				</Button>
			</View>
		</SafeAreaView>
	);
}
