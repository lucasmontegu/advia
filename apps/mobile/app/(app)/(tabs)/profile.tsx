// apps/native/app/(app)/(tabs)/profile.tsx

import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/icons";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useLanguage } from "@/contexts/language-context";
import { useUserProfile, useUserStats } from "@/hooks/use-api";
import { useIsPremium } from "@/hooks/use-subscription";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";
import { useTrialStore } from "@/stores/trial-store";
import type { ThemeMode } from "@/theme/colors";

type SettingItem = {
	icon: IconName;
	labelKey: string;
	route: Href | null;
	value?: string;
	onPress?: () => void;
};

type OptionItem = {
	value: string;
	labelKey: string;
};

const themeOptions: OptionItem[] = [
	{ value: "auto", labelKey: "profile.themeAuto" },
	{ value: "light", labelKey: "profile.themeLight" },
	{ value: "dark", labelKey: "profile.themeDark" },
];

const languageOptions: OptionItem[] = [
	{ value: "es", labelKey: "profile.languageSpanish" },
	{ value: "en", labelKey: "profile.languageEnglish" },
];

function SettingsModal({
	visible,
	onClose,
	title,
	options,
	currentValue,
	onSelect,
}: {
	visible: boolean;
	onClose: () => void;
	title: string;
	options: OptionItem[];
	currentValue: string;
	onSelect: (value: string) => void;
}) {
	const colors = useThemeColors();
	const { t } = useTranslation();

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable
				style={{
					flex: 1,
					backgroundColor: "rgba(0,0,0,0.5)",
					justifyContent: "center",
					alignItems: "center",
				}}
				onPress={onClose}
			>
				<Pressable
					style={{
						backgroundColor: colors.card,
						borderRadius: 16,
						padding: 20,
						width: "80%",
						maxWidth: 320,
					}}
					onPress={(e) => e.stopPropagation()}
				>
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 18,
							color: colors.foreground,
							marginBottom: 16,
							textAlign: "center",
						}}
					>
						{title}
					</Text>
					{options.map((option) => (
						<Pressable
							key={option.value}
							onPress={() => {
								onSelect(option.value);
								onClose();
							}}
							style={{
								flexDirection: "row",
								alignItems: "center",
								padding: 14,
								borderRadius: 10,
								backgroundColor:
									currentValue === option.value
										? colors.primary + "20"
										: "transparent",
								marginBottom: 8,
							}}
						>
							<Text
								style={{
									flex: 1,
									fontFamily: "NunitoSans_400Regular",
									fontSize: 16,
									color:
										currentValue === option.value
											? colors.primary
											: colors.foreground,
								}}
							>
								{t(option.labelKey)}
							</Text>
							{currentValue === option.value && (
								<Icon name="check" size={20} color={colors.primary} />
							)}
						</Pressable>
					))}
					<Pressable
						onPress={onClose}
						style={{
							marginTop: 8,
							padding: 12,
							alignItems: "center",
						}}
					>
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								color: colors.mutedForeground,
							}}
						>
							{t("common.cancel")}
						</Text>
					</Pressable>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

export default function ProfileScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const { t } = useTranslation();
	// Use useIsPremium hook which combines RevenueCat subscription + trial state
	const { isPremium, isSubscribed, plan } = useIsPremium();
	const { getRemainingDays } = useTrialStore();
	const remainingDays = getRemainingDays();

	// Get theme and language from contexts
	const { themeMode, setThemeMode } = useAppTheme();
	const { language, setLanguage } = useLanguage();

	// Modal states
	const [showThemeModal, setShowThemeModal] = useState(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);

	// Fetch real data from API
	const { data: profile, isLoading: profileLoading } = useUserProfile();
	const { data: stats, isLoading: statsLoading } = useUserStats();

	// Get display values for current settings
	const getThemeLabel = () => {
		switch (themeMode) {
			case "light":
				return t("profile.themeLight");
			case "dark":
				return t("profile.themeDark");
			default:
				return t("profile.themeAuto");
		}
	};

	const getLanguageLabel = () => {
		return language === "es"
			? t("profile.languageSpanish")
			: t("profile.languageEnglish");
	};

	const settings: SettingItem[] = [
		{
			icon: "notification",
			labelKey: "profile.notifications",
			route: "/notifications",
		},
		{
			icon: "location",
			labelKey: "profile.savedLocations",
			route: "/locations",
		},
		{
			icon: "theme",
			labelKey: "profile.theme",
			route: null,
			value: getThemeLabel(),
			onPress: () => setShowThemeModal(true),
		},
		{
			icon: "language",
			labelKey: "profile.language",
			route: null,
			value: getLanguageLabel(),
			onPress: () => setShowLanguageModal(true),
		},
		{ icon: "help", labelKey: "profile.help", route: null },
	];

	const handleLogout = async () => {
		await authClient.signOut();
		router.replace("/(auth)/welcome");
	};

	const handleUpgrade = () => {
		router.push("/(app)/premium");
	};

	const handleSettingPress = (setting: SettingItem) => {
		if (setting.onPress) {
			setting.onPress();
		} else if (setting.route) {
			router.push(setting.route);
		}
	};

	// Format stats for display
	const formattedStats = [
		{
			icon: "storm" as IconName,
			labelKey: "profile.stormsAvoided",
			value: stats?.stormsAvoided ?? 0,
		},
		{
			icon: "money" as IconName,
			labelKey: "profile.moneySaved",
			value: stats?.moneySaved?.toLocaleString() ?? "0",
		},
		{
			icon: "road" as IconName,
			labelKey: "profile.kmTraveled",
			value: stats?.kmTraveled ?? 0,
		},
	];

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
				{/* Header */}
				<Text
					style={{
						fontFamily: "NunitoSans_700Bold",
						fontSize: 28,
						color: colors.foreground,
						marginBottom: 24,
					}}
				>
					{t("profile.title")}
				</Text>

				{/* User Card */}
				<Pressable
					style={{
						backgroundColor: colors.card,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: colors.border,
						marginBottom: 24,
					}}
				>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
						<View
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: colors.primary,
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<Icon name="user" size={24} color={colors.primaryForeground} />
						</View>
						<View style={{ flex: 1 }}>
							{profileLoading ? (
								<ActivityIndicator
									size="small"
									color={colors.mutedForeground}
								/>
							) : (
								<>
									<Text
										style={{
											fontFamily: "NunitoSans_600SemiBold",
											color: colors.foreground,
											fontSize: 16,
										}}
									>
										{profile?.email ?? t("common.loading")}
									</Text>
									<Text
										style={{
											fontFamily: "NunitoSans_400Regular",
											color: isSubscribed
												? colors.primary
												: colors.mutedForeground,
											fontSize: 14,
										}}
									>
										{isSubscribed
											? t("profile.planPremium")
											: t("profile.trialRemaining", { days: remainingDays })}
									</Text>
								</>
							)}
						</View>
						{!isSubscribed && (
							<Pressable onPress={handleUpgrade}>
								<Text
									style={{
										color: colors.primary,
										fontFamily: "NunitoSans_600SemiBold",
									}}
								>
									{t("profile.upgrade")}
								</Text>
							</Pressable>
						)}
					</View>
				</Pressable>

				{/* Stats */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 12,
					}}
				>
					<Icon name="stats" size={18} color={colors.mutedForeground} />
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 16,
							color: colors.mutedForeground,
						}}
					>
						{t("profile.stats")}
					</Text>
				</View>
				<View
					style={{
						backgroundColor: colors.card,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: colors.border,
						marginBottom: 24,
						gap: 12,
					}}
				>
					{statsLoading ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						formattedStats.map((stat, index) => (
							<View
								key={index}
								style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
							>
								<Icon name={stat.icon} size={20} color={colors.primary} />
								<Text
									style={{
										fontFamily: "NunitoSans_400Regular",
										color: colors.foreground,
									}}
								>
									{t(stat.labelKey, {
										count: Number(stat.value),
										amount: stat.value,
										km: stat.value,
									})}
								</Text>
							</View>
						))
					)}
				</View>

				{/* Settings */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 12,
					}}
				>
					<Icon name="settings" size={18} color={colors.mutedForeground} />
					<Text
						style={{
							fontFamily: "NunitoSans_600SemiBold",
							fontSize: 16,
							color: colors.mutedForeground,
						}}
					>
						{t("profile.settings")}
					</Text>
				</View>
				<View
					style={{
						backgroundColor: colors.card,
						borderRadius: 12,
						borderWidth: 1,
						borderColor: colors.border,
						marginBottom: 24,
					}}
				>
					{settings.map((setting, index) => (
						<Pressable
							key={index}
							onPress={() => handleSettingPress(setting)}
							style={{
								flexDirection: "row",
								alignItems: "center",
								padding: 16,
								borderBottomWidth: index < settings.length - 1 ? 1 : 0,
								borderBottomColor: colors.border,
							}}
						>
							<Icon name={setting.icon} size={20} color={colors.foreground} />
							<Text
								style={{
									flex: 1,
									marginLeft: 12,
									fontFamily: "NunitoSans_400Regular",
									color: colors.foreground,
								}}
							>
								{t(setting.labelKey)}
							</Text>
							{setting.value && (
								<Text
									style={{
										fontFamily: "NunitoSans_400Regular",
										color: colors.mutedForeground,
										marginRight: 8,
									}}
								>
									{setting.value}
								</Text>
							)}
							<Icon
								name="arrowRight"
								size={16}
								color={colors.mutedForeground}
							/>
						</Pressable>
					))}
				</View>

				{/* Logout */}
				<Pressable
					onPress={handleLogout}
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 12,
						padding: 16,
					}}
				>
					<Icon name="logout" size={20} color={colors.destructive} />
					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							color: colors.destructive,
						}}
					>
						{t("profile.logout")}
					</Text>
				</Pressable>
			</ScrollView>

			{/* Theme Selection Modal */}
			<SettingsModal
				visible={showThemeModal}
				onClose={() => setShowThemeModal(false)}
				title={t("profile.selectTheme")}
				options={themeOptions}
				currentValue={themeMode}
				onSelect={(value) => setThemeMode(value as ThemeMode)}
			/>

			{/* Language Selection Modal */}
			<SettingsModal
				visible={showLanguageModal}
				onClose={() => setShowLanguageModal(false)}
				title={t("profile.selectLanguage")}
				options={languageOptions}
				currentValue={language}
				onSelect={(value) => setLanguage(value as "en" | "es")}
			/>
		</SafeAreaView>
	);
}
