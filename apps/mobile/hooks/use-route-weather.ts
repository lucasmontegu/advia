// apps/mobile/hooks/use-route-weather.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/query-client";

// ============ Route Weather Types ============

export type RoadRisk = "low" | "moderate" | "high" | "extreme";

export type RouteWeatherSegment = {
	km: number;
	lat: number;
	lng: number;
	weather: {
		temperature: number;
		humidity: number;
		windSpeed: number;
		windGust: number;
		visibility: number;
		precipitationIntensity: number;
		precipitationType: "none" | "rain" | "snow" | "hail";
		weatherCode: number;
		uvIndex: number;
		cloudCover: number;
		roadRisk: RoadRisk;
	};
};

export type RouteWeatherAnalysis = {
	id: string;
	segments: RouteWeatherSegment[];
	overallRisk: RoadRisk;
	alerts: Array<{
		id: string;
		type: string;
		severity: string;
		title: string;
		description: string;
	}>;
	validUntil: string;
	analyzedAt: string;
};

// ============ Route Weather Hooks ============

/**
 * Analyze weather conditions along a route between two points.
 * Returns segments with risk levels for visualization on the map.
 */
export function useAnalyzeRouteWeather() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			origin: { lat: number; lng: number };
			destination: { lat: number; lng: number };
			polyline?: string;
			savedRouteId?: string;
		}) => {
			const result = await api.weather.analyzeRoute.call({
				polyline: input.polyline || "",
				origin: input.origin,
				destination: input.destination,
				savedRouteId: input.savedRouteId,
			});
			return result as RouteWeatherAnalysis;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["weather"] });
		},
	});
}

/**
 * Get real-time weather updates during an active trip.
 * Returns current conditions, weather ahead, and alerts.
 */
export function useRouteWeatherUpdates(
	currentLat: number,
	currentLng: number,
	destinationLat: number,
	destinationLng: number,
	enabled = true,
) {
	return useQuery({
		...api.weather.getRouteUpdates.queryOptions({
			input: {
				currentLat,
				currentLng,
				destinationLat,
				destinationLng,
				hasActiveAlerts: false,
			},
		}),
		enabled: enabled && currentLat !== 0 && currentLng !== 0,
		refetchInterval: 1000 * 60 * 5, // 5 minutes default
	});
}

// ============ Risk Color Utils ============

export const RISK_COLORS: Record<RoadRisk, string> = {
	low: "#22c55e", // green-500
	moderate: "#eab308", // yellow-500
	high: "#f97316", // orange-500
	extreme: "#dc2626", // red-600
};

export const RISK_COLORS_TRANSLUCENT: Record<RoadRisk, string> = {
	low: "rgba(34, 197, 94, 0.6)",
	moderate: "rgba(234, 179, 8, 0.6)",
	high: "rgba(249, 115, 22, 0.6)",
	extreme: "rgba(220, 38, 38, 0.6)",
};

/**
 * Get color for a road risk level
 */
export function getRiskColor(risk: RoadRisk, translucent = false): string {
	return translucent ? RISK_COLORS_TRANSLUCENT[risk] : RISK_COLORS[risk];
}

/**
 * Get human-readable description for a risk level
 */
export function getRiskDescription(risk: RoadRisk): string {
	const descriptions: Record<RoadRisk, string> = {
		low: "Condiciones seguras",
		moderate: "Precaución recomendada",
		high: "Condiciones difíciles",
		extreme: "Peligro - evitar si es posible",
	};
	return descriptions[risk];
}

/**
 * Extended route weather data for navigation UI
 */
export type NavigationRouteWeather = {
	segments: Array<{
		km: number;
		riskLevel: RoadRisk;
		precipitationType: string;
		precipitationIntensity: number;
		windSpeed: number;
	}>;
	overallRisk: RoadRisk;
	totalDistanceKm?: number;
	totalDurationMinutes?: number;
};

/**
 * Hook for getting route weather data for navigation
 * Wrapper around useAnalyzeRouteWeather with additional computed properties
 */
export function useRouteWeather(input: {
	origin: { latitude: number; longitude: number };
	destination: { latitude: number; longitude: number };
	enabled?: boolean;
}) {
	const mutation = useAnalyzeRouteWeather();

	// Trigger analysis when coordinates change
	const queryClient = useQueryClient();

	const queryKey = [
		"routeWeather",
		input.origin.latitude,
		input.origin.longitude,
		input.destination.latitude,
		input.destination.longitude,
	];

	const query = useQuery({
		queryKey,
		queryFn: async () => {
			const result = await mutation.mutateAsync({
				origin: { lat: input.origin.latitude, lng: input.origin.longitude },
				destination: {
					lat: input.destination.latitude,
					lng: input.destination.longitude,
				},
			});

			// Transform to navigation format
			const navigationWeather: NavigationRouteWeather = {
				segments: result.segments.map((seg) => ({
					km: seg.km,
					riskLevel: seg.weather.roadRisk,
					precipitationType: seg.weather.precipitationType,
					precipitationIntensity: seg.weather.precipitationIntensity,
					windSpeed: seg.weather.windSpeed,
				})),
				overallRisk: result.overallRisk,
				totalDistanceKm:
					result.segments.length > 0
						? result.segments[result.segments.length - 1]?.km
						: undefined,
				totalDurationMinutes:
					result.segments.length > 0
						? Math.round(
								((result.segments[result.segments.length - 1]?.km ?? 0) / 60) *
									60,
							)
						: undefined, // Rough estimate: 60 km/h average
			};

			return navigationWeather;
		},
		enabled:
			input.enabled !== false &&
			input.origin.latitude !== 0 &&
			input.origin.longitude !== 0 &&
			input.destination.latitude !== 0 &&
			input.destination.longitude !== 0,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	return query;
}
