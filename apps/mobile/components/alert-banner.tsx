// apps/native/components/alert-banner.tsx
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

interface AlertBannerProps {
	alert?: {
		type: string;
		severity: "extreme" | "severe" | "moderate" | "minor";
		distance?: string;
	};
	onPress?: () => void;
}

export function AlertBanner({ alert, onPress }: AlertBannerProps) {
	const colors = useThemeColors();
	const { t } = useTranslation();

	if (!alert) {
		return null;
	}

	const severityColors = {
		extreme: colors.alert.extreme,
		severe: colors.alert.severe,
		moderate: colors.alert.moderate,
		minor: colors.alert.minor,
	};

	const severityKeys = {
		extreme: "alerts.extreme",
		severe: "alerts.severe",
		moderate: "alerts.moderate",
		minor: "alerts.minor",
	} as const;

	return (
		<Pressable
			onPress={onPress}
			style={{
				backgroundColor: severityColors[alert.severity],
				paddingHorizontal: 16,
				paddingVertical: 12,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<View style={{ flex: 1 }}>
				<Text
					style={{
						fontFamily: "NunitoSans_600SemiBold",
						fontSize: 14,
						color: "#FFFFFF",
					}}
				>
					{t(severityKeys[alert.severity])}
				</Text>
				<Text
					style={{
						fontFamily: "NunitoSans_400Regular",
						fontSize: 12,
						color: "rgba(255,255,255,0.9)",
					}}
					numberOfLines={1}
				>
					{alert.type}
					{alert.distance &&
						` ${t("alerts.distance", { distance: alert.distance })}`}
				</Text>
			</View>
			<Icon name="arrowRight" size={16} color="#FFFFFF" />
		</Pressable>
	);
}
