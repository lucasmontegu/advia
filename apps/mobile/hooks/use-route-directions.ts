// apps/mobile/hooks/use-route-directions.ts

import { env } from "@driwet/env/mobile";
import { useQuery } from "@tanstack/react-query";

export type RouteCoordinates = {
	latitude: number;
	longitude: number;
};

export type RouteDirections = {
	distance: number; // in kilometers
	duration: number; // in minutes
	geometry: {
		coordinates: [number, number][]; // [longitude, latitude][]
	};
};

type MapboxDirectionsResponse = {
	routes: Array<{
		distance: number; // meters
		duration: number; // seconds
		geometry: {
			coordinates: [number, number][];
		};
	}>;
	code: string;
};

async function fetchRouteDirections(
	origin: RouteCoordinates,
	destination: RouteCoordinates,
): Promise<RouteDirections | null> {
	try {
		const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

		const response = await fetch(
			`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
				`access_token=${env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&` +
				"geometries=geojson&" +
				"overview=full",
		);

		if (!response.ok) {
			throw new Error(`Mapbox Directions API error: ${response.status}`);
		}

		const data: MapboxDirectionsResponse = await response.json();

		if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
			return null;
		}

		const route = data.routes[0];
		if (!route) return null;

		return {
			distance: Math.round(route.distance / 1000), // Convert meters to km
			duration: Math.round(route.duration / 60), // Convert seconds to minutes
			geometry: route.geometry,
		};
	} catch (error) {
		console.error("Error fetching route directions:", error);
		return null;
	}
}

/**
 * Hook to get route directions between two points using Mapbox Directions API.
 * Returns distance (km), duration (minutes), and route geometry.
 */
export function useRouteDirections(
	origin: RouteCoordinates | null,
	destination: RouteCoordinates | null,
	enabled = true,
) {
	return useQuery({
		queryKey: [
			"route-directions",
			origin?.latitude,
			origin?.longitude,
			destination?.latitude,
			destination?.longitude,
		],
		queryFn: () => {
			if (!origin || !destination) return null;
			return fetchRouteDirections(origin, destination);
		},
		enabled: enabled && !!origin && !!destination,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
	});
}

/**
 * Format duration in minutes to a human-readable string.
 * e.g., 130 minutes -> "2h 10m"
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) {
		return `${minutes}m`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	if (remainingMinutes === 0) {
		return `${hours}h`;
	}
	return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format distance in kilometers to a human-readable string.
 * e.g., 1500 -> "1,500 km"
 */
export function formatDistance(km: number): string {
	return `${km.toLocaleString()} km`;
}
