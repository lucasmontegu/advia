// apps/native/app/(auth)/welcome.tsx

import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

export default function WelcomeScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const { t } = useTranslation();

	const handleGetStarted = () => {
		router.push("/(auth)/sign-in");
	};

	const features = [
		{ icon: "weather" as const, text: t("welcome.feature1") },
		{ icon: "route" as const, text: t("welcome.feature2") },
		{ icon: "notification" as const, text: t("welcome.feature3") },
	];

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<View className="flex-1 justify-between px-8 py-12">
				{/* Top section: Logo and tagline */}
				<View className="items-center pt-8">
					<Text
						style={{
							fontFamily: "NunitoSans_700Bold",
							fontSize: 48,
							color: colors.primary,
							marginBottom: 16,
						}}
					>
						Driwet
					</Text>

					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 24,
							color: colors.foreground,
							textAlign: "center",
							marginBottom: 8,
						}}
					>
						{t("welcome.tagline")}
					</Text>

					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 16,
							color: colors.mutedForeground,
							textAlign: "center",
						}}
					>
						{t("welcome.subtitle")}
					</Text>
				</View>

				{/* Middle: Feature highlights */}
				<View className="gap-4">
					{features.map((feature, index) => (
						<View
							key={index}
							style={{
								flexDirection: "row",
								alignItems: "center",
								backgroundColor: colors.card,
								padding: 16,
								borderRadius: 12,
								gap: 12,
							}}
						>
							<View
								style={{
									backgroundColor: colors.primary + "20",
									padding: 10,
									borderRadius: 10,
								}}
							>
								<Icon name={feature.icon} size={24} color={colors.primary} />
							</View>
							<Text
								style={{
									flex: 1,
									fontFamily: "NunitoSans_500Medium",
									fontSize: 15,
									color: colors.foreground,
								}}
							>
								{feature.text}
							</Text>
						</View>
					))}
				</View>

				{/* Bottom: CTA */}
				<View className="gap-4">
					<Button onPress={handleGetStarted} className="w-full" size="lg">
						<Button.Label>{t("welcome.getStarted")}</Button.Label>
					</Button>

					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 13,
							color: colors.mutedForeground,
							textAlign: "center",
							lineHeight: 20,
						}}
					>
						{t("welcome.freeTrialNote")}
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}
