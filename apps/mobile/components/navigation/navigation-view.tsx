// components/navigation/navigation-view.tsx
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type ViewStyle,
} from "react-native";
import {
	type Route,
	type RouteStep,
	useMapboxDirections,
} from "../../hooks/use-mapbox-directions";

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "");

export type NavigationCoordinate = {
	latitude: number;
	longitude: number;
};

export type NavigationWaypoint = NavigationCoordinate & {
	name?: string;
};

export type RouteProgress = {
	distanceRemaining: number; // meters
	durationRemaining: number; // seconds
	distanceTraveled: number; // meters
	fractionTraveled: number; // 0-1
	currentStepIndex: number;
	currentStep: RouteStep | null;
};

export type NavigationViewProps = {
	/** Starting point for navigation */
	origin: NavigationCoordinate;
	/** Final destination */
	destination: NavigationCoordinate;
	/** Optional intermediate waypoints */
	waypoints?: NavigationWaypoint[];
	/** Whether to simulate the route (for testing) */
	simulateRoute?: boolean;
	/** Language for instructions (default: "es" for Spanish) */
	locale?: string;
	/** Show cancel button overlay */
	showCancelButton?: boolean;
	/** Container style */
	style?: ViewStyle;
	/** Callback when user arrives at final destination */
	onArrival?: () => void;
	/** Callback when navigation is cancelled */
	onCancelNavigation?: () => void;
	/** Callback for route progress updates */
	onRouteProgress?: (progress: RouteProgress) => void;
	/** Callback for navigation errors */
	onError?: (error: string) => void;
	/** Callback when route is ready/loaded */
	onRouteReady?: (route: Route) => void;
};

export function NavigationView({
	origin,
	destination,
	waypoints = [],
	simulateRoute = false,
	locale = "es",
	showCancelButton = true,
	style,
	onArrival,
	onCancelNavigation,
	onRouteProgress,
	onError,
	onRouteReady,
}: NavigationViewProps) {
	const cameraRef = useRef<Mapbox.Camera>(null);
	const [userLocation, setUserLocation] = useState<NavigationCoordinate | null>(
		null,
	);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [isNavigating, setIsNavigating] = useState(false);

	const { route, loading, error, getDirections } = useMapboxDirections({
		profile: "driving-traffic",
		language: locale,
		steps: true,
		voice_instructions: true,
		banner_instructions: true,
	});

	// Fetch route on mount
	useEffect(() => {
		const fetchRoute = async () => {
			const fetchedRoute = await getDirections(origin, destination, waypoints);
			if (fetchedRoute) {
				setIsNavigating(true);
				onRouteReady?.(fetchedRoute);
			}
		};
		fetchRoute();
	}, [origin, destination, waypoints, getDirections, onRouteReady]);

	// Handle error
	useEffect(() => {
		if (error) {
			onError?.(error);
		}
	}, [error, onError]);

	// Update progress based on user location
	useEffect(() => {
		if (!route || !userLocation || !isNavigating) return;

		const totalDistance = route.distance;
		const totalDuration = route.duration;
		const steps = route.legs[0]?.steps || [];

		// Calculate distance to destination (simplified - in production use proper geolocation math)
		const distanceToDestination = calculateDistance(
			userLocation.latitude,
			userLocation.longitude,
			destination.latitude,
			destination.longitude,
		);

		const distanceTraveled = Math.max(0, totalDistance - distanceToDestination);
		const fractionTraveled = Math.min(1, distanceTraveled / totalDistance);
		const durationRemaining = totalDuration * (1 - fractionTraveled);

		// Find current step
		let accumulatedDistance = 0;
		let stepIndex = 0;
		for (let i = 0; i < steps.length; i++) {
			accumulatedDistance += steps[i].distance;
			if (distanceTraveled < accumulatedDistance) {
				stepIndex = i;
				break;
			}
		}

		setCurrentStepIndex(stepIndex);

		onRouteProgress?.({
			distanceRemaining: distanceToDestination,
			durationRemaining,
			distanceTraveled,
			fractionTraveled,
			currentStepIndex: stepIndex,
			currentStep: steps[stepIndex] || null,
		});

		// Check arrival (within 50 meters)
		if (distanceToDestination < 50) {
			setIsNavigating(false);
			onArrival?.();
		}
	}, [
		userLocation,
		route,
		isNavigating,
		destination,
		onRouteProgress,
		onArrival,
	]);

	const handleUserLocationUpdate = useCallback((location: Mapbox.Location) => {
		if (location.coords) {
			setUserLocation({
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
		}
	}, []);

	const handleCancel = useCallback(() => {
		setIsNavigating(false);
		onCancelNavigation?.();
	}, [onCancelNavigation]);

	const currentStep = route?.legs[0]?.steps[currentStepIndex];
	const routeCoordinates = route?.geometry.coordinates || [];

	return (
		<View style={[styles.container, style]}>
			<Mapbox.MapView
				style={styles.map}
				styleURL={Mapbox.StyleURL.Street}
				logoEnabled={false}
				attributionEnabled={false}
				compassEnabled={true}
				scaleBarEnabled={false}
			>
				<Mapbox.Camera
					ref={cameraRef}
					followUserLocation={isNavigating}
					followUserMode={Mapbox.UserTrackingMode.FollowWithCourse}
					followZoomLevel={16}
					followPitch={60}
					animationMode="flyTo"
					animationDuration={1000}
					defaultSettings={{
						centerCoordinate: [origin.longitude, origin.latitude],
						zoomLevel: 14,
					}}
				/>

				<Mapbox.UserLocation
					visible={true}
					onUpdate={handleUserLocationUpdate}
					showsUserHeadingIndicator={true}
				/>

				{/* Route Line */}
				{routeCoordinates.length > 0 && (
					<Mapbox.ShapeSource
						id="routeSource"
						shape={{
							type: "Feature",
							properties: {},
							geometry: {
								type: "LineString",
								coordinates: routeCoordinates,
							},
						}}
					>
						{/* Route casing (border) */}
						<Mapbox.LineLayer
							id="routeCasing"
							style={{
								lineColor: "#1a73e8",
								lineWidth: 10,
								lineOpacity: 0.3,
								lineCap: "round",
								lineJoin: "round",
							}}
						/>
						{/* Route line */}
						<Mapbox.LineLayer
							id="routeLine"
							style={{
								lineColor: "#4285f4",
								lineWidth: 6,
								lineCap: "round",
								lineJoin: "round",
							}}
						/>
					</Mapbox.ShapeSource>
				)}

				{/* Origin marker */}
				<Mapbox.PointAnnotation
					id="origin"
					coordinate={[origin.longitude, origin.latitude]}
				>
					<View style={styles.originMarker}>
						<View style={styles.originMarkerInner} />
					</View>
				</Mapbox.PointAnnotation>

				{/* Destination marker */}
				<Mapbox.PointAnnotation
					id="destination"
					coordinate={[destination.longitude, destination.latitude]}
				>
					<View style={styles.destinationMarker}>
						<View style={styles.destinationMarkerInner} />
					</View>
				</Mapbox.PointAnnotation>

				{/* Waypoint markers */}
				{waypoints.map((waypoint, index) => (
					<Mapbox.PointAnnotation
						key={`waypoint-${index}`}
						id={`waypoint-${index}`}
						coordinate={[waypoint.longitude, waypoint.latitude]}
					>
						<View style={styles.waypointMarker}>
							<Text style={styles.waypointText}>{index + 1}</Text>
						</View>
					</Mapbox.PointAnnotation>
				))}
			</Mapbox.MapView>

			{/* Navigation Instructions Panel */}
			{isNavigating && currentStep && (
				<View style={styles.instructionPanel}>
					<View style={styles.maneuverIcon}>
						<Text style={styles.maneuverText}>
							{getManeuverEmoji(
								currentStep.maneuver.type,
								currentStep.maneuver.modifier,
							)}
						</Text>
					</View>
					<View style={styles.instructionContent}>
						<Text style={styles.instructionDistance}>
							{formatDistance(currentStep.distance)}
						</Text>
						<Text style={styles.instructionText} numberOfLines={2}>
							{currentStep.instruction}
						</Text>
					</View>
				</View>
			)}

			{/* Bottom Info Panel */}
			{route && isNavigating && (
				<View style={styles.infoPanel}>
					<View style={styles.infoItem}>
						<Text style={styles.infoValue}>
							{formatDuration(route.duration)}
						</Text>
						<Text style={styles.infoLabel}>Tiempo restante</Text>
					</View>
					<View style={styles.infoDivider} />
					<View style={styles.infoItem}>
						<Text style={styles.infoValue}>
							{formatDistance(route.distance)}
						</Text>
						<Text style={styles.infoLabel}>Distancia</Text>
					</View>
				</View>
			)}

			{/* Cancel Button */}
			{showCancelButton && isNavigating && (
				<TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
					<Text style={styles.cancelButtonText}>Cancelar</Text>
				</TouchableOpacity>
			)}

			{/* Loading Indicator */}
			{loading && (
				<View style={styles.loadingOverlay}>
					<Text style={styles.loadingText}>Calculando ruta...</Text>
				</View>
			)}
		</View>
	);
}

// Helper functions
function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371000; // Earth's radius in meters
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(deg: number): number {
	return deg * (Math.PI / 180);
}

function formatDistance(meters: number): string {
	if (meters < 1000) {
		return `${Math.round(meters)} m`;
	}
	return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.ceil((seconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}min`;
	}
	return `${minutes} min`;
}

function getManeuverEmoji(type: string, modifier?: string): string {
	const maneuvers: Record<string, string> = {
		"turn-left": "⬅️",
		"turn-right": "➡️",
		"turn-sharp-left": "↩️",
		"turn-sharp-right": "↪️",
		"turn-slight-left": "↖️",
		"turn-slight-right": "↗️",
		uturn: "🔄",
		straight: "⬆️",
		merge: "↗️",
		"fork-left": "↖️",
		"fork-right": "↗️",
		"ramp-left": "↖️",
		"ramp-right": "↗️",
		roundabout: "🔄",
		rotary: "🔄",
		arrive: "🏁",
		depart: "🚗",
	};

	const key = modifier ? `${type}-${modifier}` : type;
	return maneuvers[key] || maneuvers[type] || "📍";
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	map: {
		flex: 1,
	},
	instructionPanel: {
		position: "absolute",
		top: 60,
		left: 16,
		right: 16,
		backgroundColor: "#1a73e8",
		borderRadius: 12,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	maneuverIcon: {
		width: 48,
		height: 48,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	maneuverText: {
		fontSize: 24,
	},
	instructionContent: {
		flex: 1,
	},
	instructionDistance: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "700",
	},
	instructionText: {
		color: "rgba(255,255,255,0.9)",
		fontSize: 14,
		marginTop: 4,
	},
	infoPanel: {
		position: "absolute",
		bottom: 100,
		left: 16,
		right: 16,
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	infoItem: {
		alignItems: "center",
	},
	infoValue: {
		fontSize: 20,
		fontWeight: "700",
		color: "#1a73e8",
	},
	infoLabel: {
		fontSize: 12,
		color: "#666",
		marginTop: 2,
	},
	infoDivider: {
		width: 1,
		height: 40,
		backgroundColor: "#e0e0e0",
	},
	cancelButton: {
		position: "absolute",
		bottom: 40,
		left: 16,
		right: 16,
		backgroundColor: "#f44336",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
	},
	cancelButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
	},
	originMarker: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#fff",
		borderWidth: 3,
		borderColor: "#4285f4",
		justifyContent: "center",
		alignItems: "center",
	},
	originMarkerInner: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#4285f4",
	},
	destinationMarker: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#ea4335",
		justifyContent: "center",
		alignItems: "center",
	},
	destinationMarkerInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#fff",
	},
	waypointMarker: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#fbbc04",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#fff",
	},
	waypointText: {
		color: "#000",
		fontSize: 14,
		fontWeight: "700",
	},
});
