// apps/mobile/components/route/safe-stop-card.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type SafeStopAmenity =
	| "fuel"
	| "restrooms"
	| "food"
	| "parking"
	| "coffee"
	| "atm"
	| "mechanic";

export type SafeStopData = {
	id: string;
	name: string;
	type: "gas_station" | "rest_area" | "restaurant" | "hotel" | "parking";
	km: number;
	distanceFromDanger: number; // km before danger zone
	waitTime?: number; // minutes to wait for storm/danger to pass
	amenities: SafeStopAmenity[];
	aiMessage?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
};

type SafeStopCardProps = {
	stop: SafeStopData;
	onAddToRoute?: () => void;
	onFindAlternatives?: () => void;
	onDismiss?: () => void;
};

const AMENITY_CONFIG: Record<
	SafeStopAmenity,
	{ icon: IconName; label: string }
> = {
	fuel: { icon: "route", label: "Fuel" },
	restrooms: { icon: "location", label: "Restrooms" },
	food: { icon: "location", label: "Food" },
	parking: { icon: "location", label: "Parking" },
	coffee: { icon: "location", label: "Coffee" },
	atm: { icon: "location", label: "ATM" },
	mechanic: { icon: "alert", label: "Mechanic" },
};

const STOP_TYPE_ICONS: Record<SafeStopData["type"], IconName> = {
	gas_station: "route",
	rest_area: "location",
	restaurant: "location",
	hotel: "location",
	parking: "location",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SafeStopCard({
	stop,
	onAddToRoute,
	onFindAlternatives,
	onDismiss,
}: SafeStopCardProps) {
	const colors = useThemeColors();

	return (
		<Animated.View
			entering={FadeIn.duration(400)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header with dismiss */}
			<Animated.View
				entering={FadeInUp.delay(50).duration(300)}
				style={styles.header}
			>
				<View style={styles.headerLeft}>
					<View
						style={[
							styles.iconBadge,
							{ backgroundColor: colors.primary + "15" },
						]}
					>
						<Icon name="alert" size={16} color={colors.primary} />
					</View>
					<Text style={[styles.headerTitle, { color: colors.foreground }]}>
						Recommended Safe Stop
					</Text>
				</View>
				{onDismiss && (
					<Pressable
						onPress={onDismiss}
						style={styles.dismissButton}
						accessibilityLabel="Dismiss safe stop recommendation"
					>
						<Icon name="close" size={18} color={colors.mutedForeground} />
					</Pressable>
				)}
			</Animated.View>

			{/* Stop Info */}
			<Animated.View
				entering={FadeInUp.delay(100).duration(300)}
				style={[
					styles.stopInfo,
					{ backgroundColor: colors.background, borderColor: colors.border },
				]}
			>
				<View style={styles.stopHeader}>
					<View
						style={[
							styles.stopTypeIcon,
							{ backgroundColor: colors.primary + "15" },
						]}
					>
						<Icon
							name={STOP_TYPE_ICONS[stop.type]}
							size={20}
							color={colors.primary}
						/>
					</View>
					<View style={styles.stopDetails}>
						<Text
							style={[styles.stopName, { color: colors.foreground }]}
							numberOfLines={1}
						>
							{stop.name}
						</Text>
						<Text style={[styles.stopMeta, { color: colors.mutedForeground }]}>
							km {stop.km} • {stop.distanceFromDanger} km before danger zone
						</Text>
					</View>
				</View>

				{/* Amenities */}
				<View style={styles.amenitiesContainer}>
					{stop.amenities.map((amenity) => (
						<AmenityBadge key={amenity} amenity={amenity} />
					))}
				</View>
			</Animated.View>

			{/* AI Message */}
			{stop.aiMessage && (
				<Animated.View
					entering={FadeInUp.delay(150).duration(300)}
					style={[styles.aiMessage, { backgroundColor: colors.muted }]}
				>
					<View style={styles.aiMessageIcon}>
						<Icon name="shield" size={14} color={colors.primary} />
					</View>
					<Text style={[styles.aiMessageText, { color: colors.foreground }]}>
						{stop.aiMessage}
					</Text>
				</Animated.View>
			)}

			{/* Wait time if applicable */}
			{stop.waitTime && (
				<Animated.View
					entering={FadeInUp.delay(200).duration(300)}
					style={styles.waitTimeRow}
				>
					<Icon name="clock" size={14} color={colors.mutedForeground} />
					<Text
						style={[styles.waitTimeText, { color: colors.mutedForeground }]}
					>
						Estimated wait: ~{stop.waitTime} min for conditions to clear
					</Text>
				</Animated.View>
			)}

			{/* Action Buttons */}
			<Animated.View
				entering={FadeInUp.delay(250).duration(300)}
				style={styles.actions}
			>
				{onAddToRoute && (
					<ActionButton
						label="Add to Route"
						variant="primary"
						onPress={onAddToRoute}
					/>
				)}
				{onFindAlternatives && (
					<ActionButton
						label="Find Alternatives"
						variant="secondary"
						onPress={onFindAlternatives}
					/>
				)}
			</Animated.View>
		</Animated.View>
	);
}

function AmenityBadge({ amenity }: { amenity: SafeStopAmenity }) {
	const colors = useThemeColors();
	const config = AMENITY_CONFIG[amenity];

	return (
		<View style={[styles.amenityBadge, { backgroundColor: colors.muted }]}>
			<Icon name="check" size={10} color="#22c55e" />
			<Text style={[styles.amenityText, { color: colors.foreground }]}>
				{config.label}
			</Text>
		</View>
	);
}

function ActionButton({
	label,
	variant,
	onPress,
}: {
	label: string;
	variant: "primary" | "secondary";
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

// Compact version for listing multiple stops
export function SafeStopListItem({
	stop,
	onPress,
	index = 0,
}: {
	stop: SafeStopData;
	onPress: () => void;
	index?: number;
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
			entering={FadeInUp.delay(index * 50).duration(300)}
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[styles.listItem, { backgroundColor: colors.card }, animatedStyle]}
			accessibilityRole="button"
			accessibilityLabel={`${stop.name} at km ${stop.km}`}
		>
			<View
				style={[
					styles.listItemIcon,
					{ backgroundColor: colors.primary + "15" },
				]}
			>
				<Icon
					name={STOP_TYPE_ICONS[stop.type]}
					size={18}
					color={colors.primary}
				/>
			</View>
			<View style={styles.listItemContent}>
				<Text
					style={[styles.listItemName, { color: colors.foreground }]}
					numberOfLines={1}
				>
					{stop.name}
				</Text>
				<Text
					style={[styles.listItemMeta, { color: colors.mutedForeground }]}
					numberOfLines={1}
				>
					km {stop.km} • {stop.amenities.length} amenities
				</Text>
			</View>
			<Icon name="arrowRight" size={16} color={colors.mutedForeground} />
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
		marginHorizontal: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 5,
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
	iconBadge: {
		width: 28,
		height: 28,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
	},
	dismissButton: {
		padding: 4,
	},
	stopInfo: {
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 12,
	},
	stopHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	stopTypeIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	stopDetails: {
		flex: 1,
	},
	stopName: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
	},
	stopMeta: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	amenitiesContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	amenityBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		gap: 4,
	},
	amenityText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	aiMessage: {
		flexDirection: "row",
		alignItems: "flex-start",
		padding: 12,
		borderRadius: 10,
		gap: 8,
		marginBottom: 12,
	},
	aiMessageIcon: {
		marginTop: 2,
	},
	aiMessageText: {
		flex: 1,
		fontFamily: "Inter_400Regular",
		fontSize: 13,
		lineHeight: 18,
	},
	waitTimeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 14,
	},
	waitTimeText: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	actions: {
		flexDirection: "row",
		gap: 10,
	},
	actionButton: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	actionButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
	},
	// List item styles
	listItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	listItemIcon: {
		width: 40,
		height: 40,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	listItemContent: {
		flex: 1,
	},
	listItemName: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
	},
	listItemMeta: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
});
