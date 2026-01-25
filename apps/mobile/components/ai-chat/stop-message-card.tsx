// apps/mobile/components/ai-chat/stop-message-card.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type StopAmenity =
	| "fuel"
	| "restrooms"
	| "food"
	| "parking"
	| "coffee"
	| "atm";

export type StopMessageData = {
	id: string;
	name: string;
	type: "gas_station" | "rest_area" | "restaurant" | "hotel";
	km: number;
	distanceFromCurrent?: number;
	reason: string;
	amenities: StopAmenity[];
	rating?: number;
	isOpen?: boolean;
};

type StopMessageCardProps = {
	stop: StopMessageData;
	onAddToRoute?: () => void;
	onShowOnMap?: () => void;
	onDismiss?: () => void;
};

const STOP_TYPE_ICONS: Record<StopMessageData["type"], IconName> = {
	gas_station: "gas",
	rest_area: "parking",
	restaurant: "store",
	hotel: "location",
};

const STOP_TYPE_LABELS: Record<StopMessageData["type"], string> = {
	gas_station: "Gas Station",
	rest_area: "Rest Area",
	restaurant: "Restaurant",
	hotel: "Hotel",
};

const AMENITY_CONFIG: Record<StopAmenity, { icon: IconName; label: string }> = {
	fuel: { icon: "gas", label: "Fuel" },
	restrooms: { icon: "location", label: "Restrooms" },
	food: { icon: "store", label: "Food" },
	parking: { icon: "parking", label: "Parking" },
	coffee: { icon: "store", label: "Coffee" },
	atm: { icon: "money", label: "ATM" },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StopMessageCard({
	stop,
	onAddToRoute,
	onShowOnMap,
	onDismiss,
}: StopMessageCardProps) {
	const colors = useThemeColors();
	const typeIcon = STOP_TYPE_ICONS[stop.type];
	const typeLabel = STOP_TYPE_LABELS[stop.type];

	return (
		<Animated.View
			entering={FadeInUp.duration(300).springify()}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: colors.primary + "15" },
					]}
				>
					<Icon name={typeIcon} size={18} color={colors.primary} />
				</View>
				<View style={styles.headerText}>
					<Text
						style={[styles.name, { color: colors.foreground }]}
						numberOfLines={1}
					>
						{stop.name}
					</Text>
					<View style={styles.metaRow}>
						<Text style={[styles.type, { color: colors.mutedForeground }]}>
							{typeLabel}
						</Text>
						<View
							style={[styles.dot, { backgroundColor: colors.mutedForeground }]}
						/>
						<Text style={[styles.km, { color: colors.mutedForeground }]}>
							km {stop.km}
						</Text>
						{stop.isOpen !== undefined && (
							<>
								<View
									style={[
										styles.dot,
										{ backgroundColor: colors.mutedForeground },
									]}
								/>
								<Text
									style={[
										styles.status,
										{ color: stop.isOpen ? "#22c55e" : "#dc2626" },
									]}
								>
									{stop.isOpen ? "Open" : "Closed"}
								</Text>
							</>
						)}
					</View>
				</View>
				{stop.rating && (
					<View style={styles.ratingBadge}>
						<Icon name="star" size={12} color="#eab308" />
						<Text style={[styles.ratingText, { color: colors.foreground }]}>
							{stop.rating.toFixed(1)}
						</Text>
					</View>
				)}
			</View>

			{/* Reason */}
			<View style={[styles.reasonContainer, { backgroundColor: colors.muted }]}>
				<Icon name="info" size={14} color={colors.primary} />
				<Text style={[styles.reasonText, { color: colors.foreground }]}>
					{stop.reason}
				</Text>
			</View>

			{/* Amenities */}
			{stop.amenities.length > 0 && (
				<View style={styles.amenitiesContainer}>
					{stop.amenities.map((amenity) => {
						const config = AMENITY_CONFIG[amenity];
						return (
							<View
								key={amenity}
								style={[styles.amenityBadge, { backgroundColor: colors.muted }]}
							>
								<Icon name="check" size={10} color="#22c55e" />
								<Text
									style={[styles.amenityText, { color: colors.foreground }]}
								>
									{config.label}
								</Text>
							</View>
						);
					})}
				</View>
			)}

			{/* Distance info */}
			{stop.distanceFromCurrent !== undefined && (
				<View style={styles.distanceRow}>
					<Icon name="navigation" size={12} color={colors.mutedForeground} />
					<Text
						style={[styles.distanceText, { color: colors.mutedForeground }]}
					>
						{stop.distanceFromCurrent < 1
							? `${Math.round(stop.distanceFromCurrent * 1000)}m away`
							: `${stop.distanceFromCurrent.toFixed(1)} km away`}
					</Text>
				</View>
			)}

			{/* Actions */}
			<View style={styles.actions}>
				{onAddToRoute && (
					<ActionButton
						label="Add to Route"
						variant="primary"
						onPress={onAddToRoute}
					/>
				)}
				{onShowOnMap && (
					<ActionButton
						label="Show on Map"
						variant="secondary"
						onPress={onShowOnMap}
					/>
				)}
				{onDismiss && (
					<Pressable onPress={onDismiss} style={styles.dismissButton}>
						<Text
							style={[styles.dismissText, { color: colors.mutedForeground }]}
						>
							Dismiss
						</Text>
					</Pressable>
				)}
			</View>
		</Animated.View>
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

const styles = StyleSheet.create({
	container: {
		borderRadius: 14,
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
		alignItems: "flex-start",
		gap: 10,
		marginBottom: 12,
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		flex: 1,
	},
	name: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
		marginBottom: 2,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
	},
	type: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	dot: {
		width: 3,
		height: 3,
		borderRadius: 1.5,
		marginHorizontal: 6,
	},
	km: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	status: {
		fontFamily: "Inter_500Medium",
		fontSize: 11,
	},
	ratingBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	ratingText: {
		fontFamily: "Inter_500Medium",
		fontSize: 12,
	},
	reasonContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 10,
		borderRadius: 8,
		marginBottom: 12,
	},
	reasonText: {
		flex: 1,
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		lineHeight: 17,
	},
	amenitiesContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginBottom: 12,
	},
	amenityBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	amenityText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	distanceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 12,
	},
	distanceText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	actionButton: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		alignItems: "center",
	},
	actionButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 12,
	},
	dismissButton: {
		padding: 8,
	},
	dismissText: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
});
