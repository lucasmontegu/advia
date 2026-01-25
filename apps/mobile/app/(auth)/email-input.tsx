// apps/mobile/app/(auth)/email-input.tsx

import { useRouter } from "expo-router";
import { Button, TextField } from "heroui-native";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Analytics, identifyUser } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";
import { queryClient } from "@/lib/query-client";
import { useTrialStore } from "@/stores/trial-store";

type AuthMode = "signIn" | "signUp";

export default function EmailInputScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const { t } = useTranslation();
	const { startTrial, trialStartDate } = useTrialStore();

	const [mode, setMode] = useState<AuthMode>("signIn");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onAuthSuccess = async () => {
		const isNewUser = !trialStartDate;
		if (isNewUser) {
			startTrial();
			Analytics.signUp("email");
		} else {
			Analytics.signIn("email");
		}

		const session = await authClient.getSession();
		if (session.data?.user) {
			identifyUser(session.data.user.id, {
				email: session.data.user.email ?? null,
				name: session.data.user.name ?? null,
			});
		}

		// Invalidate all queries so they refetch with the new auth token
		await queryClient.invalidateQueries();

		router.replace("/(app)/(tabs)");
	};

	const handleSignIn = async () => {
		if (!email.trim() || !password) {
			setError(t("auth.fillAllFields"));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await authClient.signIn.email({
				email: email.trim(),
				password,
			});

			if (result.error) {
				setError(result.error.message || t("auth.signInError"));
				return;
			}

			await onAuthSuccess();
		} catch (err) {
			console.error("Sign in error:", err);
			setError(t("auth.signInError"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUp = async () => {
		if (!email.trim() || !password || !name.trim()) {
			setError(t("auth.fillAllFields"));
			return;
		}

		if (password.length < 8) {
			setError(t("auth.passwordTooShort"));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await authClient.signUp.email({
				email: email.trim(),
				password,
				name: name.trim(),
			});

			if (result.error) {
				setError(result.error.message || t("auth.signUpError"));
				return;
			}

			await onAuthSuccess();
		} catch (err) {
			console.error("Sign up error:", err);
			setError(t("auth.signUpError"));
		} finally {
			setIsLoading(false);
		}
	};

	const toggleMode = () => {
		setMode(mode === "signIn" ? "signUp" : "signIn");
		setError(null);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}
			>
				<View className="flex-1 px-6 pt-4">
					{/* Back button */}
					<Pressable
						onPress={() => router.back()}
						className="mb-8"
						style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
					>
						<Icon name="arrowLeft" size={16} color={colors.primary} />
						<Text style={{ color: colors.primary, fontSize: 16 }}>
							{t("common.back")}
						</Text>
					</Pressable>

					{/* Header */}
					<Text
						style={{
							fontFamily: "NunitoSans_700Bold",
							fontSize: 28,
							color: colors.foreground,
							marginBottom: 8,
						}}
					>
						{mode === "signIn" ? t("auth.signInTitle") : t("auth.signUpTitle")}
					</Text>

					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 16,
							color: colors.mutedForeground,
							marginBottom: 24,
							lineHeight: 24,
						}}
					>
						{mode === "signIn"
							? t("auth.signInSubtitle")
							: t("auth.signUpSubtitle")}
					</Text>

					{/* Name input (sign up only) */}
					{mode === "signUp" && (
						<TextField className="mb-4">
							<TextField.Label>{t("auth.name")}</TextField.Label>
							<TextField.Input
								value={name}
								onChangeText={setName}
								placeholder={t("auth.namePlaceholder")}
								autoCapitalize="words"
								autoComplete="name"
							/>
						</TextField>
					)}

					{/* Email input */}
					<TextField className="mb-4">
						<TextField.Label>{t("auth.email")}</TextField.Label>
						<TextField.Input
							value={email}
							onChangeText={setEmail}
							placeholder={t("auth.emailPlaceholder")}
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
							autoFocus={mode === "signIn"}
						/>
					</TextField>

					{/* Password input */}
					<TextField className="mb-4">
						<TextField.Label>{t("auth.password")}</TextField.Label>
						<TextField.Input
							value={password}
							onChangeText={setPassword}
							placeholder={t("auth.passwordPlaceholder")}
							secureTextEntry
							autoCapitalize="none"
							autoComplete={
								mode === "signIn" ? "current-password" : "new-password"
							}
						/>
					</TextField>

					{mode === "signUp" && (
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 13,
								color: colors.mutedForeground,
								marginBottom: 16,
							}}
						>
							{t("auth.passwordRequirements")}
						</Text>
					)}

					{error && (
						<Text
							style={{
								color: colors.destructive,
								marginBottom: 16,
								fontFamily: "NunitoSans_400Regular",
							}}
						>
							{error}
						</Text>
					)}

					<Button
						onPress={mode === "signIn" ? handleSignIn : handleSignUp}
						size="lg"
						isDisabled={isLoading}
					>
						<Button.Label>
							{isLoading
								? t("auth.loading")
								: mode === "signIn"
									? t("auth.signIn")
									: t("auth.signUp")}
						</Button.Label>
					</Button>

					{/* Toggle mode */}
					<View className="mt-6 flex-row justify-center">
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								color: colors.mutedForeground,
							}}
						>
							{mode === "signIn"
								? t("auth.noAccount")
								: t("auth.haveAccount")}{" "}
						</Text>
						<Pressable onPress={toggleMode}>
							<Text
								style={{
									fontFamily: "NunitoSans_600SemiBold",
									color: colors.primary,
								}}
							>
								{mode === "signIn" ? t("auth.signUp") : t("auth.signIn")}
							</Text>
						</Pressable>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
