// apps/mobile/components/ai/weather-timeline-card.tsx
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { type ThemeColors, useThemeColors } from "@/hooks/use-theme-colors";

type RiskLevel = "low" | "moderate" | "high" | "extreme";
type PrecipitationType = "none" | "rain" | "snow" | "hail" | "fog";

export type TimelineSegment = {
	id: string;
	time: string; // e.g., "14:00" or "2:00 PM"
	km: number;
	temperature: number;
	precipitationType: PrecipitationType;
	precipitationProbability: number; // 0-100
	windSpeed: number;
	riskLevel: RiskLevel;
	locationName?: string;
};

type WeatherTimelineCardProps = {
	title?: string;
	segments: TimelineSegment[];
	showAIInsight?: boolean;
	aiInsight?: string;
};

const RISK_LABELS: Record<RiskLevel, string> = {
	low: "Seguro",
	moderate: "Precaución",
	high: "Alerta",
	extreme: "Peligro",
};

const PRECIPITATION_ICONS: Record<PrecipitationType, IconName> = {
	none: "check",
	rain: "storm",
	snow: "storm",
	hail: "alert",
	fog: "weather",
};

const PRECIPITATION_LABELS: Record<PrecipitationType, string> = {
	none: "Despejado",
	rain: "Lluvia",
	snow: "Nieve",
	hail: "Granizo",
	fog: "Niebla",
};

// Helper to get risk color from theme
function getRiskColor(
	risk: RiskLevel,
	colors: ReturnType<typeof useThemeColors>,
): string {
	switch (risk) {
		case "low":
			return colors.safe;
		case "moderate":
			return colors.caution;
		case "high":
			return colors.warning;
		case "extreme":
			return colors.danger;
	}
}

export function WeatherTimelineCard({
	title = "Clima en tu ruta",
	segments,
	showAIInsight = true,
	aiInsight,
}: WeatherTimelineCardProps) {
	const colors = useThemeColors();

	if (segments.length === 0) {
		return null;
	}

	// Find the worst risk segment for AI insight
	const worstSegment = segments.reduce((worst, current) => {
		const riskOrder: RiskLevel[] = ["low", "moderate", "high", "extreme"];
		return riskOrder.indexOf(current.riskLevel) >
			riskOrder.indexOf(worst.riskLevel)
			? current
			: worst;
	}, segments[0]);

	const defaultInsight = worstSegment
		? worstSegment.riskLevel === "low"
			? "🟢 Tu ruta se ve bien. Buen viaje!"
			: worstSegment.riskLevel === "moderate"
				? `⚠️ Precaución cerca de km ${worstSegment.km}. ${PRECIPITATION_LABELS[worstSegment.precipitationType]} esperada.`
				: worstSegment.riskLevel === "high"
					? `🟠 Condiciones difíciles en km ${worstSegment.km}. Considera reducir velocidad.`
					: `🔴 Peligro en km ${worstSegment.km}. Evalúa retrasar tu salida o buscar ruta alternativa.`
		: undefined;

	const worstRiskColor = worstSegment
		? getRiskColor(worstSegment.riskLevel, colors)
		: colors.safe;

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Icon name="weather" size={20} color={colors.primary} />
					<Text style={[styles.title, { color: colors.foreground }]}>
						{title}
					</Text>
				</View>
				{worstSegment && (
					<View
						style={[
							styles.riskBadge,
							{ backgroundColor: worstRiskColor + "20" },
						]}
					>
						<Text style={[styles.riskBadgeText, { color: worstRiskColor }]}>
							{RISK_LABELS[worstSegment.riskLevel]}
						</Text>
					</View>
				)}
			</View>

			{/* Timeline */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.timelineContainer}
			>
				{segments.map((segment, index) => {
					const segmentRiskColor = getRiskColor(segment.riskLevel, colors);
					return (
						<Animated.View
							key={segment.id}
							entering={FadeInRight.delay(index * 50).duration(200)}
							style={styles.segmentWrapper}
						>
							{/* Connector line */}
							{index < segments.length - 1 && (
								<View
									style={[
										styles.connector,
										{ backgroundColor: segmentRiskColor },
									]}
								/>
							)}

							{/* Segment card */}
							<View
								style={[
									styles.segment,
									{
										backgroundColor: colors.surfaceElevated,
										borderColor: segmentRiskColor,
									},
								]}
							>
								{/* Time */}
								<Text
									style={[
										styles.segmentTime,
										{ color: colors.mutedForeground },
									]}
								>
									{segment.time}
								</Text>

								{/* Weather icon */}
								<View
									style={[
										styles.weatherIconContainer,
										{ backgroundColor: segmentRiskColor + "15" },
									]}
								>
									<Icon
										name={PRECIPITATION_ICONS[segment.precipitationType]}
										size={24}
										color={segmentRiskColor}
									/>
								</View>

								{/* Temperature */}
								<Text
									style={[styles.segmentTemp, { color: colors.foreground }]}
								>
									{Math.round(segment.temperature)}°
								</Text>

								{/* Precipitation probability */}
								{segment.precipitationType !== "none" && (
									<Text
										style={[
											styles.segmentPrecip,
											{ color: colors.mutedForeground },
										]}
									>
										{segment.precipitationProbability}%
									</Text>
								)}

								{/* Location */}
								{segment.locationName && (
									<Text
										style={[
											styles.segmentLocation,
											{ color: colors.mutedForeground },
										]}
										numberOfLines={1}
									>
										{segment.locationName}
									</Text>
								)}

								{/* Km marker */}
								<Text
									style={[styles.segmentKm, { color: colors.mutedForeground }]}
								>
									km {segment.km}
								</Text>
							</View>
						</Animated.View>
					);
				})}
			</ScrollView>

			{/* AI Insight */}
			{showAIInsight && (aiInsight || defaultInsight) && (
				<View
					style={[styles.insightContainer, { backgroundColor: colors.muted }]}
				>
					<Text style={[styles.insightText, { color: colors.foreground }]}>
						{aiInsight || defaultInsight}
					</Text>
				</View>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	title: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
	},
	riskBadge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	riskBadgeText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 12,
	},
	timelineContainer: {
		paddingVertical: 8,
		gap: 0,
	},
	segmentWrapper: {
		flexDirection: "row",
		alignItems: "center",
	},
	connector: {
		position: "absolute",
		right: -20,
		width: 40,
		height: 3,
		borderRadius: 1.5,
		zIndex: -1,
	},
	segment: {
		width: 80,
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderRadius: 12,
		borderWidth: 2,
		alignItems: "center",
		marginRight: 16,
	},
	segmentTime: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
		marginBottom: 8,
	},
	weatherIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
	},
	segmentTemp: {
		fontFamily: "Inter_700Bold",
		fontSize: 18,
	},
	segmentPrecip: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
		marginTop: 2,
	},
	segmentLocation: {
		fontFamily: "Inter_400Regular",
		fontSize: 10,
		marginTop: 4,
		maxWidth: 70,
		textAlign: "center",
	},
	segmentKm: {
		fontFamily: "Inter_400Regular",
		fontSize: 10,
		marginTop: 4,
	},
	insightContainer: {
		marginTop: 16,
		padding: 12,
		borderRadius: 12,
	},
	insightText: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		lineHeight: 20,
	},
});
