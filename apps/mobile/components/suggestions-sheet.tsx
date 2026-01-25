import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";
import {
	buildNavigationURL,
	safeOpenURL,
	sanitizeCoordinates,
} from "@/lib/url-security";

type RouteLocation = {
	name: string;
	coordinates: { latitude: number; longitude: number };
};

type RouteAlert = {
	id: string;
	type: string;
	severity: "extreme" | "severe" | "moderate" | "minor";
	description: string;
	kmRange?: string;
};

type SuggestedStop = {
	id: string;
	name: string;
	type: "gas" | "rest" | "food" | "shelter";
	km: number;
	reason?: string;
};

type DestinationInfo = {
	name: string;
	crowdLevel: "low" | "medium" | "high";
	currentCount: number;
	maxCapacity: number;
};

type SuggestionsSheetProps = {
	origin: RouteLocation | null;
	destination: RouteLocation | null;
	distance?: number; // in km
	duration?: number; // in minutes
	temperature?: number;
	alerts?: RouteAlert[];
	stops?: SuggestedStop[];
	destinations?: DestinationInfo[];
	onClose?: () => void;
};

// Collapsible Section Component
function CollapsibleSection({
	title,
	icon,
	iconColor,
	children,
	defaultExpanded = true,
}: {
	title: string;
	icon: IconName;
	iconColor?: string;
	children: React.ReactNode;
	defaultExpanded?: boolean;
}) {
	const colors = useThemeColors();
	const [expanded, setExpanded] = useState(defaultExpanded);
	const rotation = useSharedValue(defaultExpanded ? 180 : 0);

	const toggleExpanded = useCallback(() => {
		setExpanded((prev) => !prev);
		rotation.value = withTiming(expanded ? 0 : 180, { duration: 200 });
	}, [expanded, rotation]);

	const chevronStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	return (
		<View style={[styles.section, { borderBottomColor: colors.border }]}>
			<TouchableOpacity
				style={styles.sectionHeader}
				onPress={toggleExpanded}
				activeOpacity={0.7}
			>
				<View style={styles.sectionHeaderLeft}>
					<Icon name={icon} size={20} color={iconColor || colors.primary} />
					<Text style={[styles.sectionTitle, { color: colors.foreground }]}>
						{title}
					</Text>
				</View>
				<Animated.View style={chevronStyle}>
					<Icon name="chevron-down" size={20} color={colors.mutedForeground} />
				</Animated.View>
			</TouchableOpacity>
			{expanded && <View style={styles.sectionContent}>{children}</View>}
		</View>
	);
}

export function SuggestionsSheet({
	origin,
	destination,
	distance = 0,
	duration = 0,
	temperature,
	alerts = [],
	stops = [],
	destinations = [],
	onClose,
}: SuggestionsSheetProps) {
	const colors = useThemeColors();
	const { t } = useTranslation();
	const bottomSheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["40%", "75%", "95%"], []);

	const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());

	const toggleStop = useCallback((stopId: string) => {
		setSelectedStops((prev) => {
			const next = new Set(prev);
			if (next.has(stopId)) {
				next.delete(stopId);
			} else {
				next.add(stopId);
			}
			return next;
		});
	}, []);

	const openInGoogleMaps = useCallback(async () => {
		if (!origin || !destination) return;

		// Validate destination coordinates
		const destCoords = sanitizeCoordinates(
			destination.coordinates.latitude,
			destination.coordinates.longitude,
		);
		if (!destCoords) {
			console.error("[Security] Invalid destination coordinates");
			Alert.alert("Error", "No se pudo abrir Google Maps");
			return;
		}

		// Build validated URL
		const url = buildNavigationURL(
			"google",
			destCoords.latitude,
			destCoords.longitude,
		);
		if (!url) {
			Alert.alert("Error", "No se pudo abrir Google Maps");
			return;
		}

		const opened = await safeOpenURL(url);
		if (!opened) {
			Alert.alert("Error", "No se pudo abrir Google Maps");
		}
	}, [destination]);

	const openInWaze = useCallback(async () => {
		if (!destination) return;

		// Validate coordinates before building URL
		const coords = sanitizeCoordinates(
			destination.coordinates.latitude,
			destination.coordinates.longitude,
		);
		if (!coords) {
			console.error("[Security] Invalid destination coordinates");
			Alert.alert("Error", "No se pudo abrir Waze");
			return;
		}

		const url = buildNavigationURL("waze", coords.latitude, coords.longitude);
		if (!url) {
			Alert.alert("Error", "No se pudo abrir Waze");
			return;
		}

		const opened = await safeOpenURL(url);
		if (!opened) {
			Alert.alert("Error", "No se pudo abrir Waze");
		}
	}, [destination]);

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins} min`;
	};

	const getSeverityColor = (severity: RouteAlert["severity"]) => {
		const severityColors = {
			extreme: colors.destructive,
			severe: "#f97316",
			moderate: "#eab308",
			minor: "#22c55e",
		};
		return severityColors[severity];
	};

	const getStopIcon = (type: SuggestedStop["type"]): IconName => {
		const icons: Record<SuggestedStop["type"], IconName> = {
			gas: "route",
			rest: "location",
			food: "location",
			shelter: "alert",
		};
		return icons[type];
	};

	const getCrowdColor = (level: DestinationInfo["crowdLevel"]) => {
		const crowdColors = {
			low: "#22c55e",
			medium: "#eab308",
			high: colors.destructive,
		};
		return crowdColors[level];
	};

	if (!origin || !destination) return null;

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={0}
			snapPoints={snapPoints}
			backgroundStyle={{ backgroundColor: colors.card }}
			handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
			enablePanDownToClose={false}
			onChange={(index) => {
				if (index === -1 && onClose) {
					onClose();
				}
			}}
		>
			<BottomSheetScrollView style={styles.container}>
				{/* Route Summary */}
				<View style={styles.summaryContainer}>
					<Text style={[styles.routeTitle, { color: colors.foreground }]}>
						{origin.name} → {destination.name}
					</Text>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Icon name="route" size={20} color={colors.primary} />
							<Text style={[styles.statValue, { color: colors.foreground }]}>
								{distance} km
							</Text>
							<Text
								style={[styles.statLabel, { color: colors.mutedForeground }]}
							>
								Distancia
							</Text>
						</View>
						<View
							style={[styles.statDivider, { backgroundColor: colors.border }]}
						/>
						<View style={styles.statItem}>
							<Icon name="clock" size={20} color={colors.primary} />
							<Text style={[styles.statValue, { color: colors.foreground }]}>
								{formatDuration(duration)}
							</Text>
							<Text
								style={[styles.statLabel, { color: colors.mutedForeground }]}
							>
								Tiempo est.
							</Text>
						</View>
						<View
							style={[styles.statDivider, { backgroundColor: colors.border }]}
						/>
						<View style={styles.statItem}>
							<Icon name="storm" size={20} color={colors.primary} />
							<Text style={[styles.statValue, { color: colors.foreground }]}>
								{temperature !== undefined
									? `${Math.round(temperature)}°C`
									: "--"}
							</Text>
							<Text
								style={[styles.statLabel, { color: colors.mutedForeground }]}
							>
								Clima
							</Text>
						</View>
					</View>
				</View>

				{/* Alerts Section */}
				{alerts.length > 0 && (
					<CollapsibleSection
						title="Alertas en ruta"
						icon="alert"
						iconColor={colors.destructive}
					>
						{alerts.map((alert) => (
							<View
								key={alert.id}
								style={[
									styles.alertItem,
									{ borderLeftColor: getSeverityColor(alert.severity) },
								]}
							>
								<View style={styles.alertHeader}>
									<View
										style={[
											styles.severityBadge,
											{
												backgroundColor:
													getSeverityColor(alert.severity) + "20",
											},
										]}
									>
										<Text
											style={[
												styles.severityText,
												{ color: getSeverityColor(alert.severity) },
											]}
										>
											{alert.severity.toUpperCase()}
										</Text>
									</View>
									{alert.kmRange && (
										<Text
											style={[
												styles.kmRange,
												{ color: colors.mutedForeground },
											]}
										>
											{alert.kmRange}
										</Text>
									)}
								</View>
								<Text
									style={[
										styles.alertDescription,
										{ color: colors.foreground },
									]}
								>
									{alert.description}
								</Text>
							</View>
						))}
					</CollapsibleSection>
				)}

				{/* Stops Section */}
				{stops.length > 0 && (
					<CollapsibleSection title="Paradas sugeridas" icon="location">
						{stops.map((stop) => (
							<TouchableOpacity
								key={stop.id}
								style={[
									styles.stopItem,
									{
										backgroundColor: selectedStops.has(stop.id)
											? colors.primary + "10"
											: "transparent",
									},
								]}
								onPress={() => toggleStop(stop.id)}
								activeOpacity={0.7}
							>
								<View
									style={[
										styles.stopCheckbox,
										{
											borderColor: selectedStops.has(stop.id)
												? colors.primary
												: colors.border,
											backgroundColor: selectedStops.has(stop.id)
												? colors.primary
												: "transparent",
										},
									]}
								>
									{selectedStops.has(stop.id) && (
										<Icon
											name="check"
											size={14}
											color={colors.primaryForeground}
										/>
									)}
								</View>
								<View style={styles.stopInfo}>
									<View style={styles.stopHeader}>
										<Icon
											name={getStopIcon(stop.type)}
											size={16}
											color={colors.primary}
										/>
										<Text
											style={[styles.stopName, { color: colors.foreground }]}
										>
											{stop.name}
										</Text>
										<Text
											style={[styles.stopKm, { color: colors.mutedForeground }]}
										>
											km {stop.km}
										</Text>
									</View>
									{stop.reason && (
										<Text
											style={[
												styles.stopReason,
												{ color: colors.mutedForeground },
											]}
										>
											"{stop.reason}"
										</Text>
									)}
								</View>
							</TouchableOpacity>
						))}
					</CollapsibleSection>
				)}

				{/* Destination Info Section */}
				{destinations.length > 0 && (
					<CollapsibleSection title="En tu destino" icon="user">
						<View style={styles.destinationsGrid}>
							{destinations.map((dest, index) => (
								<View
									key={index}
									style={[
										styles.destinationCard,
										{ backgroundColor: colors.muted },
									]}
								>
									<Text
										style={[
											styles.destinationName,
											{ color: colors.foreground },
										]}
									>
										{dest.name}
									</Text>
									<View style={styles.crowdBar}>
										<View
											style={[
												styles.crowdBarFill,
												{
													backgroundColor: getCrowdColor(dest.crowdLevel),
													width: `${(dest.currentCount / dest.maxCapacity) * 100}%`,
												},
											]}
										/>
									</View>
									<View style={styles.crowdInfo}>
										<Text
											style={[
												styles.crowdLevel,
												{ color: getCrowdColor(dest.crowdLevel) },
											]}
										>
											{dest.crowdLevel === "low"
												? "Baja"
												: dest.crowdLevel === "medium"
													? "Media"
													: "Alta"}
										</Text>
										<Text
											style={[
												styles.crowdCount,
												{ color: colors.mutedForeground },
											]}
										>
											{dest.currentCount}/{dest.maxCapacity}
										</Text>
									</View>
								</View>
							))}
						</View>
					</CollapsibleSection>
				)}

				{/* Navigation Buttons */}
				<View style={styles.navigationButtons}>
					<TouchableOpacity
						style={[
							styles.navButton,
							{ backgroundColor: colors.card, borderColor: colors.border },
						]}
						onPress={openInGoogleMaps}
						activeOpacity={0.7}
					>
						<Icon name="map" size={20} color={colors.foreground} />
						<Text style={[styles.navButtonText, { color: colors.foreground }]}>
							Abrir en Google Maps
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.navButton,
							{ backgroundColor: "#33ccff", borderColor: "#33ccff" },
						]}
						onPress={openInWaze}
						activeOpacity={0.7}
					>
						<Icon name="route" size={20} color="#ffffff" />
						<Text style={[styles.navButtonText, { color: "#ffffff" }]}>
							Abrir en Waze
						</Text>
					</TouchableOpacity>
				</View>

				{/* Bottom padding */}
				<View style={{ height: 40 }} />
			</BottomSheetScrollView>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	summaryContainer: {
		paddingVertical: 16,
	},
	routeTitle: {
		fontFamily: "Inter_700Bold",
		fontSize: 18,
		marginBottom: 16,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		paddingVertical: 16,
		paddingHorizontal: 8,
		borderRadius: 16,
	},
	statItem: {
		alignItems: "center",
		flex: 1,
	},
	statValue: {
		fontFamily: "Inter_700Bold",
		fontSize: 20,
		marginTop: 8,
	},
	statLabel: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	statDivider: {
		width: 1,
		height: 40,
	},
	section: {
		borderBottomWidth: 1,
		paddingVertical: 8,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
	},
	sectionHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	sectionTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
	},
	sectionContent: {
		paddingBottom: 12,
	},
	alertItem: {
		borderLeftWidth: 3,
		paddingLeft: 12,
		paddingVertical: 8,
		marginBottom: 8,
	},
	alertHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
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
	kmRange: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	alertDescription: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		lineHeight: 20,
	},
	stopItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderRadius: 12,
		marginBottom: 4,
	},
	stopCheckbox: {
		width: 22,
		height: 22,
		borderRadius: 6,
		borderWidth: 2,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
		marginTop: 2,
	},
	stopInfo: {
		flex: 1,
	},
	stopHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	stopName: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
		flex: 1,
	},
	stopKm: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	stopReason: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		fontStyle: "italic",
		marginTop: 4,
		marginLeft: 24,
	},
	destinationsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	destinationCard: {
		flex: 1,
		minWidth: "45%",
		padding: 12,
		borderRadius: 12,
	},
	destinationName: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
		marginBottom: 8,
	},
	crowdBar: {
		height: 6,
		backgroundColor: "#e5e5e5",
		borderRadius: 3,
		overflow: "hidden",
	},
	crowdBarFill: {
		height: "100%",
		borderRadius: 3,
	},
	crowdInfo: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 6,
	},
	crowdLevel: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 12,
	},
	crowdCount: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	navigationButtons: {
		gap: 12,
		marginTop: 16,
	},
	navButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 14,
		borderRadius: 12,
		borderWidth: 1,
		gap: 10,
	},
	navButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 15,
	},
});
