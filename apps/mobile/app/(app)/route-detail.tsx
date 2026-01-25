// apps/mobile/app/(app)/route-detail.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Linking,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { MapViewComponent } from "@/components/map-view";
import {
	AISafetySummary,
	SafeStopCard,
	type SafeStopData,
	type SafeStopSuggestion,
	type SafetyAlert,
	type WeatherCondition,
	type WeatherSegmentData,
	WeatherTimeline,
} from "@/components/route";
import { RouteRiskBadge } from "@/components/route-risk-badge";
import { useDeleteRoute, useRecordTrip, useSavedRoute } from "@/hooks/use-api";
import {
	getRiskDescription,
	RISK_COLORS,
	type RoadRisk,
	useAnalyzeRouteWeather,
} from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

export default function RouteDetailScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();

	const { data: route, isLoading: routeLoading } = useSavedRoute(id);
	const deleteRoute = useDeleteRoute();
	const recordTrip = useRecordTrip();
	const analyzeWeather = useAnalyzeRouteWeather();

	const [showNavigationOptions, setShowNavigationOptions] = useState(false);
	const [selectedSafeStop, setSelectedSafeStop] = useState<SafeStopData | null>(
		null,
	);

	// Transform weather segments for the timeline
	const weatherSegments: WeatherSegmentData[] = useMemo(() => {
		if (!analyzeWeather.data?.segments) return [];

		return analyzeWeather.data.segments.map((seg, index) => {
			// Map weather code to condition
			const getCondition = (code: number): WeatherCondition => {
				if (code >= 200 && code < 300) return "storm";
				if (code >= 300 && code < 600) return "rain";
				if (code >= 600 && code < 700) return "snow";
				if (code >= 700 && code < 800) return "fog";
				if (code >= 801) return "clouds";
				return "clear";
			};

			const nextSeg = analyzeWeather.data?.segments[index + 1];
			return {
				kmStart: seg.km,
				kmEnd: nextSeg?.km ?? seg.km + 50,
				condition: getCondition(seg.weather.weatherCode),
				temperature: seg.weather.temperature,
				risk: seg.weather.roadRisk,
				precipitationIntensity: seg.weather.precipitationIntensity,
				windSpeed: seg.weather.windSpeed,
			};
		});
	}, [analyzeWeather.data?.segments]);

	// Transform alerts for safety summary
	const safetyAlerts: SafetyAlert[] = useMemo(() => {
		if (!analyzeWeather.data?.alerts) return [];

		return analyzeWeather.data.alerts.map((alert) => ({
			id: alert.id,
			type: alert.type,
			severity: alert.severity as "minor" | "moderate" | "severe" | "extreme",
			title: alert.title,
			location: alert.description,
		}));
	}, [analyzeWeather.data?.alerts]);

	// Generate safe stop suggestions based on weather
	const safeStopSuggestions: SafeStopSuggestion[] = useMemo(() => {
		if (!analyzeWeather.data?.segments) return [];

		const dangerousSegments = analyzeWeather.data.segments.filter(
			(seg) =>
				seg.weather.roadRisk === "high" || seg.weather.roadRisk === "extreme",
		);

		if (dangerousSegments.length === 0) return [];

		// Suggest a stop before the first dangerous segment
		const firstDanger = dangerousSegments[0];
		const stopKm = Math.max(0, firstDanger.km - 10);

		return [
			{
				id: "suggested-stop-1",
				name: `Rest area km ${stopKm}`,
				km: stopKm,
				reason: "Safe area before danger zone",
				amenities: ["fuel", "restrooms", "food"],
			},
		];
	}, [analyzeWeather.data?.segments]);

	// Generate mock safe stop data for when danger is detected
	const recommendedSafeStop: SafeStopData | null = useMemo(() => {
		if (
			analyzeWeather.data?.overallRisk !== "high" &&
			analyzeWeather.data?.overallRisk !== "extreme"
		) {
			return null;
		}

		const dangerousSegments = analyzeWeather.data.segments.filter(
			(seg) =>
				seg.weather.roadRisk === "high" || seg.weather.roadRisk === "extreme",
		);

		if (dangerousSegments.length === 0) return null;

		const firstDanger = dangerousSegments[0];
		const stopKm = Math.max(0, firstDanger.km - 15);

		return {
			id: "recommended-stop",
			name: `Pemex Station "El Descanso"`,
			type: "gas_station",
			km: stopKm,
			distanceFromDanger: 15,
			waitTime: 45,
			amenities: ["fuel", "restrooms", "food", "parking"],
			aiMessage: `Wait here ~45 min for the storm to pass. I'll notify you when it's clear to continue.`,
			coordinates: {
				latitude: firstDanger.lat,
				longitude: firstDanger.lng,
			},
		};
	}, [analyzeWeather.data]);

	const handleSafeStopPress = useCallback((suggestion: SafeStopSuggestion) => {
		// Convert suggestion to full SafeStopData and show card
		setSelectedSafeStop({
			id: suggestion.id,
			name: suggestion.name,
			type: "rest_area",
			km: suggestion.km,
			distanceFromDanger: 10,
			amenities: (suggestion.amenities ?? []) as SafeStopData["amenities"],
			aiMessage: suggestion.reason,
		});
	}, []);

	const handleAddStopToRoute = useCallback(() => {
		// TODO: Integrate with route planning to add stop
		Alert.alert("Stop Added", "Safe stop has been added to your route.");
		setSelectedSafeStop(null);
	}, []);

	// Analyze weather when route loads
	useEffect(() => {
		if (route && !analyzeWeather.data && !analyzeWeather.isPending) {
			analyzeWeather.mutate({
				origin: {
					lat: Number.parseFloat(route.originLatitude),
					lng: Number.parseFloat(route.originLongitude),
				},
				destination: {
					lat: Number.parseFloat(route.destinationLatitude),
					lng: Number.parseFloat(route.destinationLongitude),
				},
				savedRouteId: route.id,
			});
		}
	}, [route, analyzeWeather]);

	const handleDelete = () => {
		Alert.alert(t("common.delete"), t("locations.deleteConfirm"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					try {
						await deleteRoute.mutateAsync(id);
						router.back();
					} catch {
						Alert.alert(t("common.error"), t("common.retry"));
					}
				},
			},
		]);
	};

	const handleStartTrip = () => {
		setShowNavigationOptions(true);
	};

	const openNavigation = async (app: "waze" | "google" | "apple") => {
		if (!route) return;

		const destLat = Number.parseFloat(route.destinationLatitude);
		const destLng = Number.parseFloat(route.destinationLongitude);

		let url = "";
		switch (app) {
			case "waze":
				url = `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
				break;
			case "google":
				url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
				break;
			case "apple":
				url = `http://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=d`;
				break;
		}

		const canOpen = await Linking.canOpenURL(url);
		if (canOpen) {
			// Record the trip start
			recordTrip.mutate({
				savedRouteId: route.id,
				originName: route.originName,
				originLatitude: Number.parseFloat(route.originLatitude),
				originLongitude: Number.parseFloat(route.originLongitude),
				destinationName: route.destinationName,
				destinationLatitude: destLat,
				destinationLongitude: destLng,
				weatherCondition:
					analyzeWeather.data?.overallRisk === "extreme" ? "storm" : "clear",
				outcome: "completed",
			});

			Linking.openURL(url);
			setShowNavigationOptions(false);
		}
	};

	const handleRefreshWeather = () => {
		if (route) {
			analyzeWeather.mutate({
				origin: {
					lat: Number.parseFloat(route.originLatitude),
					lng: Number.parseFloat(route.originLongitude),
				},
				destination: {
					lat: Number.parseFloat(route.destinationLatitude),
					lng: Number.parseFloat(route.destinationLongitude),
				},
				savedRouteId: route.id,
			});
		}
	};

	const destination = useMemo(() => {
		if (!route) return undefined;
		return {
			latitude: Number.parseFloat(route.destinationLatitude),
			longitude: Number.parseFloat(route.destinationLongitude),
		};
	}, [route]);

	if (routeLoading) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
				<View
					style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
				>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			</SafeAreaView>
		);
	}

	if (!route) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						padding: 24,
					}}
				>
					<Icon name="route" size={48} color={colors.mutedForeground} />
					<Text
						style={{
							fontFamily: "NunitoSans_400Regular",
							fontSize: 16,
							color: colors.mutedForeground,
							marginTop: 16,
						}}
					>
						{t("routes.noResults")}
					</Text>
					<Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
						<Text
							style={{
								fontFamily: "NunitoSans_600SemiBold",
								color: colors.primary,
							}}
						>
							{t("auth.back")}
						</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			{/* Header */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 16,
					paddingVertical: 12,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				}}
			>
				<Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
					<Icon name="arrowLeft" size={24} color={colors.foreground} />
				</Pressable>
				<Text
					style={{
						fontFamily: "NunitoSans_700Bold",
						fontSize: 20,
						color: colors.foreground,
						flex: 1,
					}}
					numberOfLines={1}
				>
					{route.name}
				</Text>
				<Pressable onPress={handleDelete} style={{ padding: 4 }}>
					<Icon name="trash" size={20} color={colors.destructive} />
				</Pressable>
			</View>

			{/* Map with weather visualization */}
			<View style={{ height: 300 }}>
				<MapViewComponent
					routeSegments={analyzeWeather.data?.segments ?? []}
					showRouteIcons={true}
					destination={destination}
				/>

				{/* Weather loading overlay */}
				{analyzeWeather.isPending && (
					<View
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: "rgba(0,0,0,0.5)",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<ActivityIndicator size="large" color="#fff" />
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								color: "#fff",
								marginTop: 12,
							}}
						>
							{t("routes.analyzing")}
						</Text>
					</View>
				)}

				{/* Risk badge */}
				{analyzeWeather.data && (
					<View style={{ position: "absolute", top: 16, left: 16 }}>
						<RouteRiskBadge risk={analyzeWeather.data.overallRisk} />
					</View>
				)}
			</View>

			{/* Route info */}
			<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
				{/* Origin → Destination */}
				<View
					style={{
						backgroundColor: colors.card,
						borderRadius: 12,
						padding: 16,
						marginBottom: 16,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 12,
						}}
					>
						<View
							style={{
								width: 12,
								height: 12,
								borderRadius: 6,
								backgroundColor: colors.primary,
								marginRight: 12,
							}}
						/>
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 14,
								color: colors.foreground,
								flex: 1,
							}}
						>
							{route.originName}
						</Text>
					</View>
					<View
						style={{
							width: 2,
							height: 20,
							backgroundColor: colors.border,
							marginLeft: 5,
							marginBottom: 12,
						}}
					/>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<View
							style={{
								width: 12,
								height: 12,
								borderRadius: 6,
								backgroundColor: colors.destructive,
								marginRight: 12,
							}}
						/>
						<Text
							style={{
								fontFamily: "NunitoSans_400Regular",
								fontSize: 14,
								color: colors.foreground,
								flex: 1,
							}}
						>
							{route.destinationName}
						</Text>
					</View>
				</View>

				{/* Weather Timeline - Horizontal scrollable segments */}
				{analyzeWeather.data && weatherSegments.length > 0 && (
					<View style={{ marginHorizontal: -16, marginBottom: 16 }}>
						<WeatherTimeline
							segments={weatherSegments}
							overallRisk={analyzeWeather.data.overallRisk}
							totalDistanceKm={
								weatherSegments.length > 0
									? weatherSegments[weatherSegments.length - 1]?.kmEnd
									: undefined
							}
							isLoading={analyzeWeather.isPending}
						/>
					</View>
				)}

				{/* AI Safety Summary */}
				{analyzeWeather.data && (
					<View style={{ marginHorizontal: -16, marginBottom: 16 }}>
						<AISafetySummary
							overallRisk={analyzeWeather.data.overallRisk}
							alerts={safetyAlerts}
							suggestions={safeStopSuggestions}
							onSuggestionPress={handleSafeStopPress}
						/>
					</View>
				)}

				{/* Recommended Safe Stop Card - Shows when dangerous conditions detected */}
				{recommendedSafeStop && !selectedSafeStop && (
					<View style={{ marginHorizontal: -16, marginBottom: 16 }}>
						<SafeStopCard
							stop={recommendedSafeStop}
							onAddToRoute={handleAddStopToRoute}
							onFindAlternatives={() =>
								Alert.alert("Alternatives", "Finding alternative stops...")
							}
							onDismiss={() => {}}
						/>
					</View>
				)}

				{/* Selected Safe Stop Detail */}
				{selectedSafeStop && (
					<View style={{ marginHorizontal: -16, marginBottom: 16 }}>
						<SafeStopCard
							stop={selectedSafeStop}
							onAddToRoute={handleAddStopToRoute}
							onDismiss={() => setSelectedSafeStop(null)}
						/>
					</View>
				)}

				{/* Start trip button */}
				<Pressable
					onPress={handleStartTrip}
					style={{
						backgroundColor: colors.primary,
						borderRadius: 12,
						padding: 16,
						alignItems: "center",
					}}
				>
					<Text
						style={{
							fontFamily: "NunitoSans_700Bold",
							fontSize: 16,
							color: "#fff",
						}}
					>
						{t("routes.startTrip")}
					</Text>
				</Pressable>

				{/* Navigation options modal */}
				{showNavigationOptions && (
					<View
						style={{
							marginTop: 16,
							backgroundColor: colors.card,
							borderRadius: 12,
							padding: 16,
						}}
					>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<Text
								style={{
									fontFamily: "NunitoSans_600SemiBold",
									fontSize: 14,
									color: colors.foreground,
								}}
							>
								{t("routes.navigateWith")}
							</Text>
							<Pressable
								onPress={() => setShowNavigationOptions(false)}
								hitSlop={8}
							>
								<Icon name="close" size={20} color={colors.mutedForeground} />
							</Pressable>
						</View>
						<View style={{ flexDirection: "row", gap: 12 }}>
							<Pressable
								onPress={() => openNavigation("waze")}
								style={{
									flex: 1,
									backgroundColor: colors.muted,
									borderRadius: 8,
									padding: 12,
									alignItems: "center",
								}}
							>
								<Text
									style={{
										fontFamily: "NunitoSans_600SemiBold",
										color: colors.foreground,
									}}
								>
									Waze
								</Text>
							</Pressable>
							<Pressable
								onPress={() => openNavigation("google")}
								style={{
									flex: 1,
									backgroundColor: colors.muted,
									borderRadius: 8,
									padding: 12,
									alignItems: "center",
								}}
							>
								<Text
									style={{
										fontFamily: "NunitoSans_600SemiBold",
										color: colors.foreground,
									}}
								>
									Google Maps
								</Text>
							</Pressable>
							{Platform.OS === "ios" && (
								<Pressable
									onPress={() => openNavigation("apple")}
									style={{
										flex: 1,
										backgroundColor: colors.muted,
										borderRadius: 8,
										padding: 12,
										alignItems: "center",
									}}
								>
									<Text
										style={{
											fontFamily: "NunitoSans_600SemiBold",
											color: colors.foreground,
										}}
									>
										Apple Maps
									</Text>
								</Pressable>
							)}
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
