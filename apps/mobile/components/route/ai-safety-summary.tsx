// apps/mobile/components/route/ai-safety-summary.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import type { RoadRisk } from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type SafetyAlert = {
	id: string;
	type: string;
	severity: "minor" | "moderate" | "severe" | "extreme";
	title: string;
	location?: string;
	kmRange?: string;
	estimatedTime?: string;
};

export type SafeStopSuggestion = {
	id: string;
	name: string;
	km: number;
	reason: string;
	amenities?: string[];
};

type AISafetySummaryProps = {
	overallRisk: RoadRisk;
	alerts: SafetyAlert[];
	suggestions: SafeStopSuggestion[];
	onAlertPress?: (alert: SafetyAlert) => void;
	onSuggestionPress?: (suggestion: SafeStopSuggestion) => void;
	onVoiceReadout?: () => void;
};

const RISK_STYLES: Record<
	RoadRisk,
	{ bg: string; border: string; text: string; icon: IconName }
> = {
	low: {
		bg: "rgba(34, 197, 94, 0.1)",
		border: "#22c55e",
		text: "#16a34a",
		icon: "check",
	},
	moderate: {
		bg: "rgba(234, 179, 8, 0.1)",
		border: "#eab308",
		text: "#ca8a04",
		icon: "alert",
	},
	high: {
		bg: "rgba(249, 115, 22, 0.1)",
		border: "#f97316",
		text: "#ea580c",
		icon: "alert",
	},
	extreme: {
		bg: "rgba(220, 38, 38, 0.1)",
		border: "#dc2626",
		text: "#dc2626",
		icon: "alert",
	},
};

const RISK_MESSAGES: Record<RoadRisk, string> = {
	low: "Looking great! Clear conditions for your trip.",
	moderate: "Some caution recommended along the route.",
	high: "Difficult conditions ahead. Consider alternatives.",
	extreme: "Severe weather detected. I recommend postponing.",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AISafetySummary({
	overallRisk,
	alerts,
	suggestions,
	onAlertPress,
	onSuggestionPress,
	onVoiceReadout,
}: AISafetySummaryProps) {
	const colors = useThemeColors();
	const riskStyle = RISK_STYLES[overallRisk];

	return (
		<Animated.View
			entering={FadeIn.duration(400)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header */}
			<Animated.View
				entering={FadeInUp.delay(50).duration(300)}
				style={styles.header}
			>
				<View style={styles.headerLeft}>
					<View
						style={[
							styles.avatarContainer,
							{ backgroundColor: colors.primary + "15" },
						]}
					>
						<Icon name="shield" size={18} color={colors.primary} />
					</View>
					<Text style={[styles.headerTitle, { color: colors.foreground }]}>
						AI Safety Summary
					</Text>
				</View>
				{onVoiceReadout && (
					<Pressable
						onPress={onVoiceReadout}
						style={[styles.voiceButton, { backgroundColor: colors.muted }]}
						accessibilityLabel="Read safety summary aloud"
						accessibilityRole="button"
					>
						<Icon name="voice" size={16} color={colors.mutedForeground} />
					</Pressable>
				)}
			</Animated.View>

			{/* Overall Risk Banner */}
			<Animated.View
				entering={FadeInUp.delay(100).duration(300)}
				style={[
					styles.riskBanner,
					{
						backgroundColor: riskStyle.bg,
						borderColor: riskStyle.border,
					},
				]}
			>
				<View style={styles.riskIconContainer}>
					<Icon name={riskStyle.icon} size={20} color={riskStyle.border} />
				</View>
				<Text style={[styles.riskMessage, { color: riskStyle.text }]}>
					{RISK_MESSAGES[overallRisk]}
				</Text>
			</Animated.View>

			{/* Alerts Section */}
			{alerts.length > 0 && (
				<Animated.View
					entering={FadeInUp.delay(150).duration(300)}
					style={styles.section}
				>
					<Text
						style={[styles.sectionTitle, { color: colors.mutedForeground }]}
					>
						Alerts on Route
					</Text>
					<View style={styles.alertsList}>
						{alerts.slice(0, 3).map((alert, index) => (
							<AlertItem
								key={alert.id}
								alert={alert}
								index={index}
								onPress={() => onAlertPress?.(alert)}
							/>
						))}
					</View>
				</Animated.View>
			)}

			{/* Suggestions Section */}
			{suggestions.length > 0 && (
				<Animated.View
					entering={FadeInUp.delay(200).duration(300)}
					style={styles.section}
				>
					<Text
						style={[styles.sectionTitle, { color: colors.mutedForeground }]}
					>
						Recommended Stops
					</Text>
					<View style={styles.suggestionsList}>
						{suggestions.slice(0, 2).map((suggestion, index) => (
							<SuggestionItem
								key={suggestion.id}
								suggestion={suggestion}
								index={index}
								onPress={() => onSuggestionPress?.(suggestion)}
							/>
						))}
					</View>
				</Animated.View>
			)}

			{/* Empty state when all clear */}
			{alerts.length === 0 && suggestions.length === 0 && (
				<Animated.View
					entering={FadeInUp.delay(150).duration(300)}
					style={styles.emptyState}
				>
					<Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
						No alerts or stops needed. Drive safe!
					</Text>
				</Animated.View>
			)}
		</Animated.View>
	);
}

function AlertItem({
	alert,
	index,
	onPress,
}: {
	alert: SafetyAlert;
	index: number;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);

	const severityColors = {
		minor: "#22c55e",
		moderate: "#eab308",
		severe: "#f97316",
		extreme: "#dc2626",
	};

	const alertColor = severityColors[alert.severity];

	const handlePressIn = () => {
		scale.value = withSpring(0.98);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<AnimatedPressable
			entering={FadeInUp.delay(150 + index * 50).duration(250)}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.alertItem,
				{ backgroundColor: alertColor + "10" },
				animatedStyle,
			]}
			accessibilityRole="button"
			accessibilityLabel={`${alert.title}. ${alert.location || ""}`}
		>
			<View style={[styles.alertIndicator, { backgroundColor: alertColor }]} />
			<View style={styles.alertContent}>
				<Text
					style={[styles.alertTitle, { color: colors.foreground }]}
					numberOfLines={1}
				>
					{alert.title}
				</Text>
				{(alert.kmRange || alert.location) && (
					<Text
						style={[styles.alertMeta, { color: colors.mutedForeground }]}
						numberOfLines={1}
					>
						{alert.kmRange || alert.location}
					</Text>
				)}
			</View>
			<Icon name="arrowRight" size={16} color={colors.mutedForeground} />
		</AnimatedPressable>
	);
}

function SuggestionItem({
	suggestion,
	index,
	onPress,
}: {
	suggestion: SafeStopSuggestion;
	index: number;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);

	const handlePressIn = () => {
		scale.value = withSpring(0.98);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<AnimatedPressable
			entering={FadeInUp.delay(200 + index * 50).duration(250)}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.suggestionItem,
				{ backgroundColor: colors.primary + "08" },
				animatedStyle,
			]}
			accessibilityRole="button"
			accessibilityLabel={`${suggestion.name} at km ${suggestion.km}. ${suggestion.reason}`}
		>
			<View
				style={[
					styles.suggestionIcon,
					{ backgroundColor: colors.primary + "15" },
				]}
			>
				<Icon name="location" size={16} color={colors.primary} />
			</View>
			<View style={styles.suggestionContent}>
				<Text
					style={[styles.suggestionName, { color: colors.foreground }]}
					numberOfLines={1}
				>
					{suggestion.name}
				</Text>
				<Text
					style={[styles.suggestionMeta, { color: colors.mutedForeground }]}
					numberOfLines={1}
				>
					km {suggestion.km} • {suggestion.reason}
				</Text>
				{suggestion.amenities && suggestion.amenities.length > 0 && (
					<View style={styles.amenitiesRow}>
						{suggestion.amenities.slice(0, 4).map((amenity) => (
							<View
								key={amenity}
								style={[styles.amenityBadge, { backgroundColor: colors.muted }]}
							>
								<Text
									style={[
										styles.amenityText,
										{ color: colors.mutedForeground },
									]}
								>
									{amenity}
								</Text>
							</View>
						))}
					</View>
				)}
			</View>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
		marginHorizontal: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 14,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	avatarContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
	},
	voiceButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	riskBanner: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		gap: 10,
		marginBottom: 14,
	},
	riskIconContainer: {
		width: 32,
		height: 32,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	riskMessage: {
		flex: 1,
		fontFamily: "Inter_500Medium",
		fontSize: 13,
		lineHeight: 18,
	},
	section: {
		marginTop: 4,
	},
	sectionTitle: {
		fontFamily: "Inter_500Medium",
		fontSize: 12,
		marginBottom: 10,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	alertsList: {
		gap: 8,
	},
	alertItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 10,
		gap: 10,
	},
	alertIndicator: {
		width: 4,
		height: 24,
		borderRadius: 2,
	},
	alertContent: {
		flex: 1,
	},
	alertTitle: {
		fontFamily: "Inter_500Medium",
		fontSize: 13,
	},
	alertMeta: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	suggestionsList: {
		gap: 8,
	},
	suggestionItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		padding: 12,
		borderRadius: 10,
		gap: 10,
	},
	suggestionIcon: {
		width: 32,
		height: 32,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	suggestionContent: {
		flex: 1,
	},
	suggestionName: {
		fontFamily: "Inter_500Medium",
		fontSize: 13,
	},
	suggestionMeta: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	amenitiesRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
		marginTop: 6,
	},
	amenityBadge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	amenityText: {
		fontFamily: "Inter_400Regular",
		fontSize: 10,
	},
	emptyState: {
		padding: 16,
		alignItems: "center",
	},
	emptyText: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
});
