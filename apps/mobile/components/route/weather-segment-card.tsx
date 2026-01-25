// apps/mobile/components/route/weather-segment-card.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import type { RoadRisk } from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type WeatherCondition =
	| "clear"
	| "clouds"
	| "rain"
	| "storm"
	| "snow"
	| "fog";

export type WeatherSegmentData = {
	kmStart: number;
	kmEnd?: number;
	condition: WeatherCondition;
	temperature: number;
	risk: RoadRisk;
	precipitationIntensity?: number;
	windSpeed?: number;
	estimatedArrival?: Date;
};

type WeatherSegmentCardProps = {
	segment: WeatherSegmentData;
	index: number;
	isSelected?: boolean;
	onPress?: () => void;
	compact?: boolean;
};

const RISK_STYLES: Record<
	RoadRisk,
	{ bg: string; border: string; text: string }
> = {
	low: {
		bg: "rgba(34, 197, 94, 0.15)",
		border: "#22c55e",
		text: "#16a34a",
	},
	moderate: {
		bg: "rgba(234, 179, 8, 0.15)",
		border: "#eab308",
		text: "#ca8a04",
	},
	high: {
		bg: "rgba(249, 115, 22, 0.15)",
		border: "#f97316",
		text: "#ea580c",
	},
	extreme: {
		bg: "rgba(220, 38, 38, 0.15)",
		border: "#dc2626",
		text: "#dc2626",
	},
};

const CONDITION_ICONS: Record<WeatherCondition, IconName> = {
	clear: "weather",
	clouds: "weather",
	rain: "rain",
	storm: "storm",
	snow: "weather",
	fog: "weather",
};

const RISK_LABELS: Record<RoadRisk, string> = {
	low: "Safe",
	moderate: "Caution",
	high: "Warning",
	extreme: "Danger",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WeatherSegmentCard({
	segment,
	index,
	isSelected = false,
	onPress,
	compact = false,
}: WeatherSegmentCardProps) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);

	const riskStyle = RISK_STYLES[segment.risk];
	const icon = CONDITION_ICONS[segment.condition];

	const handlePressIn = () => {
		scale.value = withSpring(0.95);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	if (compact) {
		return (
			<AnimatedPressable
				entering={FadeIn.delay(index * 50).duration(300)}
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				style={[
					styles.compactContainer,
					{
						backgroundColor: riskStyle.bg,
						borderColor: isSelected ? riskStyle.border : "transparent",
					},
					animatedStyle,
				]}
				accessibilityRole="button"
				accessibilityLabel={`${segment.kmStart}km, ${segment.temperature}°C, ${RISK_LABELS[segment.risk]}`}
			>
				<Icon name={icon} size={16} color={riskStyle.border} />
				<Text style={[styles.compactKm, { color: colors.mutedForeground }]}>
					{segment.kmStart}km
				</Text>
			</AnimatedPressable>
		);
	}

	return (
		<AnimatedPressable
			entering={FadeIn.delay(index * 80).duration(400)}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.container,
				{
					backgroundColor: riskStyle.bg,
					borderColor: isSelected ? riskStyle.border : riskStyle.bg,
				},
				animatedStyle,
			]}
			accessibilityRole="button"
			accessibilityLabel={`Segment ${segment.kmStart}km to ${segment.kmEnd ?? segment.kmStart + 50}km. ${segment.temperature} degrees. ${RISK_LABELS[segment.risk]} conditions.`}
		>
			{/* Weather Icon */}
			<View
				style={[
					styles.iconContainer,
					{ backgroundColor: riskStyle.border + "20" },
				]}
			>
				<Icon name={icon} size={20} color={riskStyle.border} />
			</View>

			{/* Segment Info */}
			<View style={styles.infoContainer}>
				<Text style={[styles.kmText, { color: colors.foreground }]}>
					{segment.kmStart}km
				</Text>
				<Text style={[styles.tempText, { color: colors.mutedForeground }]}>
					{Math.round(segment.temperature)}°C
				</Text>
			</View>

			{/* Risk Badge */}
			<View
				style={[styles.riskBadge, { backgroundColor: riskStyle.border + "20" }]}
			>
				<Text style={[styles.riskText, { color: riskStyle.text }]}>
					{RISK_LABELS[segment.risk]}
				</Text>
			</View>
		</AnimatedPressable>
	);
}

// Expanded detail view for when segment is tapped
export function WeatherSegmentDetail({
	segment,
	onClose,
}: {
	segment: WeatherSegmentData;
	onClose: () => void;
}) {
	const colors = useThemeColors();
	const riskStyle = RISK_STYLES[segment.risk];

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			style={[styles.detailContainer, { backgroundColor: colors.card }]}
		>
			<View style={styles.detailHeader}>
				<Text style={[styles.detailTitle, { color: colors.foreground }]}>
					km {segment.kmStart} - {segment.kmEnd ?? segment.kmStart + 50}
				</Text>
				<Pressable onPress={onClose} style={styles.closeButton}>
					<Icon name="close" size={18} color={colors.mutedForeground} />
				</Pressable>
			</View>

			<View style={styles.detailGrid}>
				<DetailRow
					label="Temperature"
					value={`${Math.round(segment.temperature)}°C`}
					colors={colors}
				/>
				<DetailRow
					label="Condition"
					value={
						segment.condition.charAt(0).toUpperCase() +
						segment.condition.slice(1)
					}
					colors={colors}
				/>
				{segment.precipitationIntensity !== undefined && (
					<DetailRow
						label="Precipitation"
						value={`${segment.precipitationIntensity.toFixed(1)} mm/h`}
						colors={colors}
					/>
				)}
				{segment.windSpeed !== undefined && (
					<DetailRow
						label="Wind"
						value={`${Math.round(segment.windSpeed)} km/h`}
						colors={colors}
					/>
				)}
			</View>

			<View style={[styles.riskIndicator, { backgroundColor: riskStyle.bg }]}>
				<Icon
					name={segment.risk === "low" ? "check" : "alert"}
					size={16}
					color={riskStyle.border}
				/>
				<Text style={[styles.riskIndicatorText, { color: riskStyle.text }]}>
					{RISK_LABELS[segment.risk]} conditions
				</Text>
			</View>
		</Animated.View>
	);
}

function DetailRow({
	label,
	value,
	colors,
}: {
	label: string;
	value: string;
	colors: ReturnType<typeof useThemeColors>;
}) {
	return (
		<View style={styles.detailRow}>
			<Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
				{label}
			</Text>
			<Text style={[styles.detailValue, { color: colors.foreground }]}>
				{value}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		borderWidth: 2,
		gap: 10,
		minWidth: 140,
	},
	compactContainer: {
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 10,
		borderWidth: 2,
		gap: 4,
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	infoContainer: {
		flex: 1,
	},
	kmText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
	},
	tempText: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	compactKm: {
		fontFamily: "Inter_500Medium",
		fontSize: 11,
	},
	riskBadge: {
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 6,
	},
	riskText: {
		fontFamily: "Inter_500Medium",
		fontSize: 11,
	},
	detailContainer: {
		padding: 16,
		borderRadius: 16,
		marginTop: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	detailHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	detailTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
	},
	closeButton: {
		padding: 4,
	},
	detailGrid: {
		gap: 12,
		marginBottom: 16,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	detailLabel: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
	detailValue: {
		fontFamily: "Inter_500Medium",
		fontSize: 13,
	},
	riskIndicator: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderRadius: 8,
		gap: 8,
	},
	riskIndicatorText: {
		fontFamily: "Inter_500Medium",
		fontSize: 13,
	},
});
