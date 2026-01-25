// apps/mobile/components/ai/alert-card.tsx

import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";
type AlertType = "weather" | "road" | "traffic" | "safety" | "general";

export type AlertData = {
	id: string;
	type: AlertType;
	severity: AlertSeverity;
	headline: string;
	description?: string;
	source?: string;
	expiresAt?: string;
	affectedArea?: string;
	kmRange?: { start: number; end: number };
};

type AlertCardProps = {
	alert: AlertData;
	aiRecommendation?: string;
	showActions?: boolean;
	onDismiss?: () => void;
	onViewDetails?: () => void;
	onFindShelter?: () => void;
};

const SEVERITY_CONFIG: Record<
	AlertSeverity,
	{ icon: IconName; label: string; colorKey: string }
> = {
	extreme: { icon: "alert", label: "EXTREMO", colorKey: "danger" },
	severe: { icon: "alert", label: "SEVERO", colorKey: "warning" },
	moderate: { icon: "warning", label: "MODERADO", colorKey: "caution" },
	minor: { icon: "info", label: "MENOR", colorKey: "safe" },
};

const TYPE_CONFIG: Record<AlertType, { icon: IconName; label: string }> = {
	weather: { icon: "storm", label: "Clima" },
	road: { icon: "road", label: "Ruta" },
	traffic: { icon: "route", label: "Tráfico" },
	safety: { icon: "alert", label: "Seguridad" },
	general: { icon: "info", label: "General" },
};

function AnimatedAlertIcon({
	severity,
	color,
}: {
	severity: AlertSeverity;
	color: string;
}) {
	const scale = useSharedValue(1);

	useEffect(() => {
		if (severity === "extreme" || severity === "severe") {
			scale.value = withRepeat(
				withSequence(
					withTiming(1.15, { duration: 400 }),
					withTiming(1, { duration: 400 }),
				),
				-1,
				false,
			);
		}
	}, [severity, scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<Animated.View style={animatedStyle}>
			<Icon name={SEVERITY_CONFIG[severity].icon} size={24} color={color} />
		</Animated.View>
	);
}

export function AlertCard({
	alert,
	aiRecommendation,
	showActions = true,
	onDismiss,
	onViewDetails,
	onFindShelter,
}: AlertCardProps) {
	const colors = useThemeColors();
	const severityConfig = SEVERITY_CONFIG[alert.severity];
	const typeConfig = TYPE_CONFIG[alert.type];
	const severityColor = colors[
		severityConfig.colorKey as keyof typeof colors
	] as string;

	const defaultRecommendation =
		alert.severity === "extreme"
			? "🚨 Driwet recomienda: Busca refugio inmediatamente o considera retrasar tu viaje."
			: alert.severity === "severe"
				? "⚠️ Driwet recomienda: Reduce la velocidad y mantente alerta. Considera una ruta alternativa."
				: alert.severity === "moderate"
					? "🟡 Driwet recomienda: Conduce con precaución en esta zona."
					: "✅ Driwet dice: Alerta menor, puedes continuar con normalidad.";

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			style={[
				styles.container,
				{
					backgroundColor: colors.card,
					borderLeftColor: severityColor,
				},
			]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<View
						style={[
							styles.iconContainer,
							{ backgroundColor: severityColor + "15" },
						]}
					>
						<AnimatedAlertIcon
							severity={alert.severity}
							color={severityColor}
						/>
					</View>
					<View style={styles.headerText}>
						<View style={styles.badges}>
							<View
								style={[
									styles.severityBadge,
									{ backgroundColor: severityColor + "20" },
								]}
							>
								<Text style={[styles.severityText, { color: severityColor }]}>
									{severityConfig.label}
								</Text>
							</View>
							<View
								style={[styles.typeBadge, { backgroundColor: colors.muted }]}
							>
								<Icon
									name={typeConfig.icon}
									size={12}
									color={colors.mutedForeground}
								/>
								<Text
									style={[styles.typeText, { color: colors.mutedForeground }]}
								>
									{typeConfig.label}
								</Text>
							</View>
						</View>
						<Text
							style={[styles.headline, { color: colors.foreground }]}
							numberOfLines={2}
						>
							{alert.headline}
						</Text>
					</View>
				</View>

				{onDismiss && (
					<TouchableOpacity
						onPress={onDismiss}
						style={styles.dismissButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Icon name="close" size={18} color={colors.mutedForeground} />
					</TouchableOpacity>
				)}
			</View>

			{/* Description */}
			{alert.description && (
				<Text style={[styles.description, { color: colors.mutedForeground }]}>
					{alert.description}
				</Text>
			)}

			{/* Meta info */}
			<View style={styles.metaRow}>
				{alert.kmRange && (
					<View style={styles.metaItem}>
						<Icon name="route" size={12} color={colors.mutedForeground} />
						<Text style={[styles.metaText, { color: colors.mutedForeground }]}>
							km {alert.kmRange.start} - {alert.kmRange.end}
						</Text>
					</View>
				)}
				{alert.affectedArea && (
					<View style={styles.metaItem}>
						<Icon name="location" size={12} color={colors.mutedForeground} />
						<Text style={[styles.metaText, { color: colors.mutedForeground }]}>
							{alert.affectedArea}
						</Text>
					</View>
				)}
				{alert.source && (
					<View style={styles.metaItem}>
						<Icon name="info" size={12} color={colors.mutedForeground} />
						<Text style={[styles.metaText, { color: colors.mutedForeground }]}>
							{alert.source}
						</Text>
					</View>
				)}
			</View>

			{/* AI Recommendation */}
			<View
				style={[
					styles.recommendationContainer,
					{ backgroundColor: colors.muted },
				]}
			>
				<Text style={[styles.recommendationText, { color: colors.foreground }]}>
					{aiRecommendation || defaultRecommendation}
				</Text>
			</View>

			{/* Actions */}
			{showActions &&
				(alert.severity === "extreme" || alert.severity === "severe") && (
					<View style={styles.actions}>
						{onFindShelter && (
							<TouchableOpacity
								style={[
									styles.actionButton,
									{ backgroundColor: severityColor },
								]}
								onPress={onFindShelter}
								activeOpacity={0.8}
							>
								<Icon name="location" size={16} color={colors.card} />
								<Text style={[styles.actionButtonText, { color: colors.card }]}>
									Buscar refugio
								</Text>
							</TouchableOpacity>
						)}
						{onViewDetails && (
							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.actionButtonOutline,
									{ borderColor: colors.border },
								]}
								onPress={onViewDetails}
								activeOpacity={0.8}
							>
								<Icon name="info" size={16} color={colors.foreground} />
								<Text
									style={[
										styles.actionButtonText,
										{ color: colors.foreground },
									]}
								>
									Ver más
								</Text>
							</TouchableOpacity>
						)}
					</View>
				)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		borderLeftWidth: 4,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	headerLeft: {
		flexDirection: "row",
		flex: 1,
		gap: 12,
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		flex: 1,
	},
	badges: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 6,
	},
	severityBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	severityText: {
		fontFamily: "Inter_700Bold",
		fontSize: 10,
	},
	typeBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	typeText: {
		fontFamily: "Inter_400Regular",
		fontSize: 10,
	},
	headline: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
		lineHeight: 20,
	},
	dismissButton: {
		padding: 4,
	},
	description: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
		lineHeight: 18,
		marginTop: 12,
	},
	metaRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 16,
		marginTop: 12,
	},
	metaItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	metaText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	recommendationContainer: {
		marginTop: 16,
		padding: 12,
		borderRadius: 12,
	},
	recommendationText: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		lineHeight: 20,
	},
	actions: {
		flexDirection: "row",
		gap: 12,
		marginTop: 16,
	},
	actionButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		borderRadius: 12,
		gap: 8,
	},
	actionButtonOutline: {
		backgroundColor: "transparent",
		borderWidth: 1,
	},
	actionButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
	},
});
