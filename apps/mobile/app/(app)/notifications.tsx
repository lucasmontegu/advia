// apps/mobile/app/(app)/notifications.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	Linking,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useNotificationsContext } from "@/contexts/notifications-context";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

type NotificationSettingKey =
	| "weatherAlerts"
	| "routeUpdates"
	| "weeklySummary";

interface NotificationSetting {
	key: NotificationSettingKey;
	titleKey: string;
	descriptionKey: string;
	enabled: boolean;
	urgent?: boolean;
}

const NOTIFICATION_SETTINGS_KEY = "@driwet/notification_settings";

export default function NotificationsScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const { t } = useTranslation();
	const {
		permissionStatus,
		requestPermissions,
		hasPermission,
		needsPermission,
	} = useNotificationsContext();

	// Local state for notification settings
	const [settings, setSettings] = useState({
		weatherAlerts: true,
		routeUpdates: true,
		weeklySummary: false,
	});

	// Load settings on mount
	useState(() => {
		AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY).then((stored) => {
			if (stored) {
				try {
					setSettings(JSON.parse(stored));
				} catch {
					// Keep defaults
				}
			}
		});
	});

	const notificationSettings: NotificationSetting[] = [
		{
			key: "weatherAlerts",
			titleKey: "notifications.weatherAlerts",
			descriptionKey: "notifications.weatherAlertsDesc",
			enabled: settings.weatherAlerts,
			urgent: true,
		},
		{
			key: "routeUpdates",
			titleKey: "notifications.routeUpdates",
			descriptionKey: "notifications.routeUpdatesDesc",
			enabled: settings.routeUpdates,
		},
		{
			key: "weeklySummary",
			titleKey: "notifications.weeklySummary",
			descriptionKey: "notifications.weeklySummaryDesc",
			enabled: settings.weeklySummary,
		},
	];

	const handleToggle = useCallback(
		async (key: NotificationSettingKey, value: boolean) => {
			const newSettings = { ...settings, [key]: value };
			setSettings(newSettings);
			await AsyncStorage.setItem(
				NOTIFICATION_SETTINGS_KEY,
				JSON.stringify(newSettings),
			);
		},
		[settings],
	);

	const handleOpenSettings = () => {
		if (Platform.OS === "ios") {
			Linking.openURL("app-settings:");
		} else {
			Linking.openSettings();
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<Icon name="arrowLeft" size={24} color={colors.foreground} />
				</Pressable>
				<Text style={[styles.title, { color: colors.foreground }]}>
					{t("notifications.title")}
				</Text>
				<View style={{ width: 24 }} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Permission Banner */}
				{!hasPermission && (
					<View
						style={[
							styles.permissionBanner,
							{ backgroundColor: colors.alert.moderate + "20" },
						]}
					>
						<Icon name="notification" size={24} color={colors.alert.moderate} />
						<View style={styles.permissionContent}>
							<Text
								style={[styles.permissionTitle, { color: colors.foreground }]}
							>
								{needsPermission
									? t("notifications.enableNotifications")
									: t("notifications.notificationsDisabled")}
							</Text>
							<Text
								style={[
									styles.permissionDesc,
									{ color: colors.mutedForeground },
								]}
							>
								{needsPermission
									? t("notifications.enableDesc")
									: t("notifications.disabledDesc")}
							</Text>
						</View>
						<Pressable
							style={[styles.enableButton, { backgroundColor: colors.primary }]}
							onPress={
								needsPermission ? requestPermissions : handleOpenSettings
							}
						>
							<Text
								style={[
									styles.enableButtonText,
									{ color: colors.primaryForeground },
								]}
							>
								{needsPermission
									? t("notifications.enable")
									: t("notifications.openSettings")}
							</Text>
						</Pressable>
					</View>
				)}

				{/* Notification Types */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.foreground }]}>
						{t("notifications.types")}
					</Text>

					{notificationSettings.map((setting, index) => (
						<View
							key={setting.key}
							style={[
								styles.settingItem,
								{ backgroundColor: colors.card },
								index === 0 && styles.settingItemFirst,
								index === notificationSettings.length - 1 &&
									styles.settingItemLast,
							]}
						>
							<View style={styles.settingContent}>
								<View style={styles.settingHeader}>
									<Text
										style={[styles.settingTitle, { color: colors.foreground }]}
									>
										{t(setting.titleKey)}
									</Text>
									{setting.urgent && (
										<View
											style={[
												styles.urgentBadge,
												{ backgroundColor: colors.alert.extreme + "20" },
											]}
										>
											<Text
												style={[
													styles.urgentText,
													{ color: colors.alert.extreme },
												]}
											>
												{t("notifications.urgent")}
											</Text>
										</View>
									)}
								</View>
								<Text
									style={[
										styles.settingDesc,
										{ color: colors.mutedForeground },
									]}
								>
									{t(setting.descriptionKey)}
								</Text>
							</View>
							<Switch
								value={setting.enabled && hasPermission}
								onValueChange={(value) => handleToggle(setting.key, value)}
								disabled={!hasPermission}
								trackColor={{
									false: colors.muted,
									true: colors.primary + "80",
								}}
								thumbColor={
									setting.enabled && hasPermission
										? colors.primary
										: colors.mutedForeground
								}
							/>
						</View>
					))}
				</View>

				{/* Info */}
				<View style={styles.infoSection}>
					<Icon name="info" size={16} color={colors.mutedForeground} />
					<Text style={[styles.infoText, { color: colors.mutedForeground }]}>
						{t("notifications.infoText")}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	title: {
		fontFamily: "NunitoSans_700Bold",
		fontSize: 18,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	permissionBanner: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
		gap: 12,
	},
	permissionContent: {
		flex: 1,
	},
	permissionTitle: {
		fontFamily: "NunitoSans_600SemiBold",
		fontSize: 14,
		marginBottom: 4,
	},
	permissionDesc: {
		fontFamily: "NunitoSans_400Regular",
		fontSize: 12,
		lineHeight: 18,
	},
	enableButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
	enableButtonText: {
		fontFamily: "NunitoSans_600SemiBold",
		fontSize: 13,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontFamily: "NunitoSans_700Bold",
		fontSize: 16,
		marginBottom: 12,
	},
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		marginBottom: 1,
	},
	settingItemFirst: {
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
	},
	settingItemLast: {
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
		marginBottom: 0,
	},
	settingContent: {
		flex: 1,
		marginRight: 16,
	},
	settingHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	settingTitle: {
		fontFamily: "NunitoSans_600SemiBold",
		fontSize: 15,
	},
	urgentBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	urgentText: {
		fontFamily: "NunitoSans_600SemiBold",
		fontSize: 10,
		textTransform: "uppercase",
	},
	settingDesc: {
		fontFamily: "NunitoSans_400Regular",
		fontSize: 13,
		lineHeight: 18,
	},
	infoSection: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 16,
	},
	infoText: {
		flex: 1,
		fontFamily: "NunitoSans_400Regular",
		fontSize: 12,
		lineHeight: 18,
	},
});
