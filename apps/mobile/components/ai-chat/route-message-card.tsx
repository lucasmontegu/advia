// apps/mobile/components/ai-chat/route-message-card.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Icon } from "@/components/icons";
import type { RoadRisk } from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type RouteMessageData = {
	id: string;
	originName: string;
	destinationName: string;
	distanceKm: number;
	durationMinutes: number;
	overallRisk: RoadRisk;
	departureTime?: Date;
	weatherSummary?: string;
};

type RouteMessageCardProps = {
	route: RouteMessageData;
	onStartNavigation?: () => void;
	onEditRoute?: () => void;
	onSaveRoute?: () => void;
};

const RISK_STYLES: Record<
	RoadRisk,
	{ bg: string; text: string; label: string }
> = {
	low: { bg: "rgba(34, 197, 94, 0.15)", text: "#16a34a", label: "Safe" },
	moderate: {
		bg: "rgba(234, 179, 8, 0.15)",
		text: "#ca8a04",
		label: "Caution",
	},
	high: { bg: "rgba(249, 115, 22, 0.15)", text: "#ea580c", label: "Warning" },
	extreme: { bg: "rgba(220, 38, 38, 0.15)", text: "#dc2626", label: "Danger" },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RouteMessageCard({
	route,
	onStartNavigation,
	onEditRoute,
	onSaveRoute,
}: RouteMessageCardProps) {
	const colors = useThemeColors();
	const riskStyle = RISK_STYLES[route.overallRisk];

	const formatDuration = (minutes: number): string => {
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	};

	return (
		<Animated.View
			entering={FadeInUp.duration(300).springify()}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Route Header */}
			<View style={styles.header}>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: colors.primary + "15" },
					]}
				>
					<Icon name="route" size={18} color={colors.primary} />
				</View>
				<Text style={[styles.title, { color: colors.foreground }]}>
					Route Ready
				</Text>
				<View style={[styles.riskBadge, { backgroundColor: riskStyle.bg }]}>
					<Text style={[styles.riskText, { color: riskStyle.text }]}>
						{riskStyle.label}
					</Text>
				</View>
			</View>

			{/* Route Points */}
			<View style={styles.routePoints}>
				<View style={styles.routePoint}>
					<View
						style={[styles.routeDot, { backgroundColor: colors.primary }]}
					/>
					<Text
						style={[styles.routePointText, { color: colors.foreground }]}
						numberOfLines={1}
					>
						{route.originName}
					</Text>
				</View>
				<View style={[styles.routeLine, { backgroundColor: colors.border }]} />
				<View style={styles.routePoint}>
					<View
						style={[styles.routeDot, { backgroundColor: colors.destructive }]}
					/>
					<Text
						style={[styles.routePointText, { color: colors.foreground }]}
						numberOfLines={1}
					>
						{route.destinationName}
					</Text>
				</View>
			</View>

			{/* Route Stats */}
			<View style={[styles.statsRow, { borderTopColor: colors.border }]}>
				<View style={styles.stat}>
					<Icon name="road" size={14} color={colors.mutedForeground} />
					<Text style={[styles.statText, { color: colors.mutedForeground }]}>
						{Math.round(route.distanceKm)} km
					</Text>
				</View>
				<View style={styles.stat}>
					<Icon name="clock" size={14} color={colors.mutedForeground} />
					<Text style={[styles.statText, { color: colors.mutedForeground }]}>
						{formatDuration(route.durationMinutes)}
					</Text>
				</View>
				{route.departureTime && (
					<View style={styles.stat}>
						<Icon name="navigation" size={14} color={colors.mutedForeground} />
						<Text style={[styles.statText, { color: colors.mutedForeground }]}>
							{route.departureTime.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</View>
				)}
			</View>

			{/* Weather Summary */}
			{route.weatherSummary && (
				<View
					style={[styles.weatherSummary, { backgroundColor: riskStyle.bg }]}
				>
					<Icon name="weather" size={14} color={riskStyle.text} />
					<Text style={[styles.weatherText, { color: riskStyle.text }]}>
						{route.weatherSummary}
					</Text>
				</View>
			)}

			{/* Action Buttons */}
			<View style={styles.actions}>
				{onStartNavigation && (
					<ActionButton
						label="Start Navigation"
						variant="primary"
						onPress={onStartNavigation}
					/>
				)}
				{onEditRoute && (
					<ActionButton
						label="Edit"
						variant="secondary"
						onPress={onEditRoute}
					/>
				)}
				{onSaveRoute && (
					<ActionButton
						label="Save"
						variant="secondary"
						icon="star"
						onPress={onSaveRoute}
					/>
				)}
			</View>
		</Animated.View>
	);
}

function ActionButton({
	label,
	variant,
	icon,
	onPress,
}: {
	label: string;
	variant: "primary" | "secondary";
	icon?: "star" | "route";
	onPress: () => void;
}) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);

	const handlePressIn = () => {
		scale.value = withSpring(0.96);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const isPrimary = variant === "primary";

	return (
		<AnimatedPressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.actionButton,
				{
					backgroundColor: isPrimary ? colors.primary : colors.muted,
					flex: isPrimary ? 1 : undefined,
				},
				animatedStyle,
			]}
			accessibilityRole="button"
			accessibilityLabel={label}
		>
			{icon && (
				<Icon
					name={icon}
					size={14}
					color={isPrimary ? colors.primaryForeground : colors.foreground}
				/>
			)}
			<Text
				style={[
					styles.actionButtonText,
					{ color: isPrimary ? colors.primaryForeground : colors.foreground },
				]}
			>
				{label}
			</Text>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 14,
		marginVertical: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 2,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	iconContainer: {
		width: 32,
		height: 32,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		flex: 1,
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
	},
	riskBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	riskText: {
		fontFamily: "Inter_500Medium",
		fontSize: 11,
	},
	routePoints: {
		marginBottom: 12,
	},
	routePoint: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	routeDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	routeLine: {
		width: 2,
		height: 16,
		marginLeft: 4,
		marginVertical: 2,
	},
	routePointText: {
		flex: 1,
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
	statsRow: {
		flexDirection: "row",
		gap: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		marginBottom: 12,
	},
	stat: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	statText: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	weatherSummary: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		padding: 10,
		borderRadius: 8,
		marginBottom: 12,
	},
	weatherText: {
		flex: 1,
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	actions: {
		flexDirection: "row",
		gap: 8,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
	},
	actionButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 13,
	},
});
