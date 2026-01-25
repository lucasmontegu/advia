// apps/mobile/app/(app)/navigation.tsx

import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Platform,
	Pressable,
	StatusBar,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, {
	FadeIn,
	FadeOut,
	SlideInUp,
	SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { NavigationView } from "@/components/navigation/navigation-view";
import { useNavigation } from "@/hooks/use-navigation";
import { useNavigationCopilot } from "@/hooks/use-navigation-copilot";
import { useRouteWeather } from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";

type NavigationParams = {
	originLat: string;
	originLng: string;
	destLat: string;
	destLng: string;
	originName?: string;
	destName?: string;
	simulate?: string;
};

export default function NavigationScreen() {
	const params = useLocalSearchParams<NavigationParams>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const colors = useThemeColors();

	const [showControls, setShowControls] = useState(true);
	const [isStarted, setIsStarted] = useState(false);

	// Parse coordinates from params
	const origin = {
		latitude: Number.parseFloat(params.originLat || "0"),
		longitude: Number.parseFloat(params.originLng || "0"),
	};

	const destination = {
		latitude: Number.parseFloat(params.destLat || "0"),
		longitude: Number.parseFloat(params.destLng || "0"),
	};

	const shouldSimulate = params.simulate === "true";

	// Navigation state management
	const navigation = useNavigation();

	// Weather-aware copilot
	const copilot = useNavigationCopilot({
		enabled: true,
		language: "es",
		voiceEnabled: !navigation.isMuted,
	});

	// Get route weather data
	const { data: routeWeather, isLoading: isLoadingWeather } = useRouteWeather({
		origin,
		destination,
	});

	// Update copilot with weather data
	useEffect(() => {
		if (routeWeather?.segments) {
			const mapWeatherType = (
				precipType: string,
			): "rain" | "hail" | "storm" | "wind" | "fog" | "clear" => {
				switch (precipType) {
					case "rain":
						return "rain";
					case "hail":
						return "hail";
					case "snow":
						return "storm"; // Map snow to storm for alerting
					default:
						return "clear";
				}
			};

			const weatherSegments = routeWeather.segments.map((seg, index) => ({
				startKm: index * 10,
				endKm: (index + 1) * 10,
				condition: {
					type: mapWeatherType(seg.precipitationType),
					severity: seg.riskLevel as "low" | "moderate" | "high" | "extreme",
					precipitationIntensity: seg.precipitationIntensity,
					windSpeed: seg.windSpeed,
				},
				roadRisk: seg.riskLevel as "low" | "moderate" | "high" | "extreme",
			}));
			copilot.updateWeatherSegments(weatherSegments);
		}
	}, [routeWeather, copilot]);

	// Start navigation and copilot
	const handleStartNavigation = useCallback(async () => {
		setIsStarted(true);

		// Start copilot
		copilot.start();

		// Announce route summary if weather data available
		if (routeWeather) {
			await copilot.announceRouteSummary({
				distanceKm: routeWeather.totalDistanceKm || 0,
				durationMinutes: routeWeather.totalDurationMinutes || 0,
				weatherRisk: routeWeather.overallRisk || "moderate",
			});
		}

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	}, [copilot, routeWeather]);

	// Handle arrival
	const handleArrival = useCallback(() => {
		copilot.stop();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		Alert.alert("¡Llegaste!", "Has llegado a tu destino.", [
			{
				text: "Finalizar",
				onPress: () => router.back(),
			},
		]);
	}, [copilot, router]);

	// Handle cancel navigation
	const handleCancel = useCallback(() => {
		Alert.alert(
			"¿Cancelar navegación?",
			"¿Estás seguro de que querés cancelar la navegación?",
			[
				{
					text: "Continuar",
					style: "cancel",
				},
				{
					text: "Cancelar",
					style: "destructive",
					onPress: () => {
						copilot.stop();
						router.back();
					},
				},
			],
		);
	}, [copilot, router]);

	// Toggle controls visibility
	const handleMapTap = useCallback(() => {
		setShowControls((prev) => !prev);
	}, []);

	// Toggle mute
	const handleToggleMute = useCallback(() => {
		navigation.toggleMute();
		copilot.toggleMute();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}, [navigation, copilot]);

	// Update copilot with navigation progress
	const handleRouteProgress = useCallback(
		(progress: Parameters<typeof navigation.handleRouteProgress>[0]) => {
			navigation.handleRouteProgress(progress);
			copilot.updateProgress(progress);
		},
		[navigation, copilot],
	);

	// Validate coordinates
	if (
		!origin.latitude ||
		!origin.longitude ||
		!destination.latitude ||
		!destination.longitude
	) {
		return (
			<View
				style={[styles.errorContainer, { backgroundColor: colors.background }]}
			>
				<Icon name="alert" size={48} color={colors.destructive} />
				<Text style={[styles.errorText, { color: colors.foreground }]}>
					Coordenadas inválidas
				</Text>
				<Pressable
					style={[styles.errorButton, { backgroundColor: colors.primary }]}
					onPress={() => router.back()}
				>
					<Text style={styles.errorButtonText}>Volver</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			{/* Navigation Map */}
			<Pressable style={styles.mapContainer} onPress={handleMapTap}>
				<NavigationView
					origin={origin}
					destination={destination}
					locale="es"
					showCancelButton={false}
					onArrival={handleArrival}
					onCancelNavigation={handleCancel}
					onRouteProgress={(progress) => {
						handleRouteProgress(progress);
					}}
					onRouteReady={() => {
						navigation.handleRouteReady();
						if (!isStarted) {
							handleStartNavigation();
						}
					}}
					onError={(error) => {
						console.error("[Navigation] Error:", error);
					}}
				/>
			</Pressable>

			{/* Top Controls */}
			{showControls && (
				<Animated.View
					entering={SlideInUp.duration(200)}
					exiting={SlideOutDown.duration(150)}
					style={[
						styles.topControls,
						{
							paddingTop: insets.top + 8,
							backgroundColor: "rgba(0,0,0,0.7)",
						},
					]}
				>
					{/* Route Info */}
					<View style={styles.routeInfo}>
						<View style={styles.routeDestination}>
							<Icon name="pin" size={18} color={colors.primary} />
							<Text style={styles.destinationText} numberOfLines={1}>
								{params.destName || "Destino"}
							</Text>
						</View>

						{navigation.progress && (
							<View style={styles.routeStats}>
								<View style={styles.statItem}>
									<Text style={styles.statValue}>
										{navigation.getFormattedDistance()}
									</Text>
									<Text style={styles.statLabel}>restante</Text>
								</View>
								<View style={styles.statDivider} />
								<View style={styles.statItem}>
									<Text style={styles.statValue}>
										{navigation.getFormattedETA()}
									</Text>
									<Text style={styles.statLabel}>ETA</Text>
								</View>
							</View>
						)}
					</View>

					{/* Weather Risk Badge */}
					{routeWeather?.overallRisk && (
						<Animated.View
							entering={FadeIn}
							style={[
								styles.weatherBadge,
								{
									backgroundColor:
										routeWeather.overallRisk === "extreme"
											? colors.destructive
											: routeWeather.overallRisk === "high"
												? "#f97316"
												: routeWeather.overallRisk === "moderate"
													? "#eab308"
													: colors.safe,
								},
							]}
						>
							<Icon name="storm" size={14} color="#fff" />
							<Text style={styles.weatherBadgeText}>
								{routeWeather.overallRisk === "extreme"
									? "Peligro"
									: routeWeather.overallRisk === "high"
										? "Alto riesgo"
										: routeWeather.overallRisk === "moderate"
											? "Precaución"
											: "Favorable"}
							</Text>
						</Animated.View>
					)}
				</Animated.View>
			)}

			{/* Bottom Controls */}
			{showControls && (
				<Animated.View
					entering={SlideInUp.duration(200)}
					exiting={SlideOutDown.duration(150)}
					style={[
						styles.bottomControls,
						{
							paddingBottom: insets.bottom + 16,
							backgroundColor: "rgba(0,0,0,0.85)",
						},
					]}
				>
					{/* Copilot Message */}
					{copilot.lastMessage && (
						<Animated.View
							entering={FadeIn}
							exiting={FadeOut}
							style={styles.copilotMessage}
						>
							<Icon name="voice" size={16} color={colors.primary} />
							<Text style={styles.copilotText} numberOfLines={2}>
								{copilot.lastMessage}
							</Text>
						</Animated.View>
					)}

					{/* Control Buttons */}
					<View style={styles.controlButtons}>
						<Pressable
							style={({ pressed }) => [
								styles.controlButton,
								{
									backgroundColor: pressed
										? colors.muted
										: "rgba(255,255,255,0.1)",
								},
							]}
							onPress={handleToggleMute}
						>
							<Icon
								name={navigation.isMuted ? "mute" : "voice"}
								size={24}
								color="#fff"
							/>
							<Text style={styles.controlButtonText}>
								{navigation.isMuted ? "Activar voz" : "Silenciar"}
							</Text>
						</Pressable>

						<Pressable
							style={({ pressed }) => [
								styles.cancelButton,
								{ opacity: pressed ? 0.8 : 1 },
							]}
							onPress={handleCancel}
						>
							<Icon name="close" size={24} color="#fff" />
							<Text style={styles.cancelButtonText}>Cancelar</Text>
						</Pressable>

						<Pressable
							style={({ pressed }) => [
								styles.controlButton,
								{
									backgroundColor: pressed
										? colors.muted
										: "rgba(255,255,255,0.1)",
								},
							]}
							onPress={() => copilot.checkAndAnnounce()}
						>
							<Icon name="storm" size={24} color="#fff" />
							<Text style={styles.controlButtonText}>Clima</Text>
						</Pressable>
					</View>
				</Animated.View>
			)}

			{/* Loading overlay */}
			{isLoadingWeather && !isStarted && (
				<View style={styles.loadingOverlay}>
					<View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
						<Icon name="route" size={32} color={colors.primary} />
						<Text style={[styles.loadingText, { color: colors.foreground }]}>
							Analizando condiciones de la ruta...
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	mapContainer: {
		flex: 1,
	},
	topControls: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	routeInfo: {
		marginTop: 8,
	},
	routeDestination: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	destinationText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
		flex: 1,
	},
	routeStats: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
		gap: 16,
	},
	statItem: {
		alignItems: "center",
	},
	statValue: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "700",
	},
	statLabel: {
		color: "rgba(255,255,255,0.6)",
		fontSize: 12,
		marginTop: 2,
	},
	statDivider: {
		width: 1,
		height: 30,
		backgroundColor: "rgba(255,255,255,0.2)",
	},
	weatherBadge: {
		position: "absolute",
		right: 16,
		top: Platform.OS === "ios" ? 60 : 50,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	weatherBadgeText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "600",
	},
	bottomControls: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	copilotMessage: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 12,
		padding: 12,
		marginBottom: 16,
	},
	copilotText: {
		color: "#fff",
		fontSize: 14,
		flex: 1,
		lineHeight: 20,
	},
	controlButtons: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
	},
	controlButton: {
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
		borderRadius: 12,
		minWidth: 80,
	},
	controlButtonText: {
		color: "#fff",
		fontSize: 11,
		marginTop: 4,
	},
	cancelButton: {
		backgroundColor: "#dc2626",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 12,
	},
	cancelButtonText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "600",
		marginTop: 4,
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.8)",
		justifyContent: "center",
		alignItems: "center",
	},
	loadingCard: {
		padding: 24,
		borderRadius: 16,
		alignItems: "center",
		gap: 12,
	},
	loadingText: {
		fontSize: 14,
		textAlign: "center",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		gap: 16,
	},
	errorText: {
		fontSize: 18,
		fontWeight: "600",
		textAlign: "center",
	},
	errorButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
		marginTop: 8,
	},
	errorButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
