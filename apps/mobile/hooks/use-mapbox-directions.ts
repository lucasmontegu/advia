// hooks/use-mapbox-directions.ts
import { useCallback, useState } from "react";

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

export type Coordinate = {
	latitude: number;
	longitude: number;
};

export type RouteStep = {
	instruction: string;
	distance: number; // meters
	duration: number; // seconds
	maneuver: {
		type: string;
		modifier?: string;
		bearing_before: number;
		bearing_after: number;
		location: [number, number];
	};
};

export type RouteLeg = {
	distance: number; // meters
	duration: number; // seconds
	steps: RouteStep[];
	summary: string;
};

export type Route = {
	distance: number; // meters
	duration: number; // seconds
	geometry: {
		coordinates: [number, number][];
		type: string;
	};
	legs: RouteLeg[];
	weight: number;
	weight_name: string;
};

export type DirectionsResponse = {
	routes: Route[];
	waypoints: {
		name: string;
		location: [number, number];
	}[];
	code: string;
	uuid: string;
};

type UseMapboxDirectionsOptions = {
	profile?: "driving-traffic" | "driving" | "walking" | "cycling";
	language?: string;
	alternatives?: boolean;
	steps?: boolean;
	geometries?: "geojson" | "polyline" | "polyline6";
	overview?: "full" | "simplified" | "false";
	annotations?: string[];
	voice_instructions?: boolean;
	banner_instructions?: boolean;
};

export function useMapboxDirections(options: UseMapboxDirectionsOptions = {}) {
	const [route, setRoute] = useState<Route | null>(null);
	const [routes, setRoutes] = useState<Route[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		profile = "driving-traffic",
		language = "es",
		alternatives = false,
		steps = true,
		geometries = "geojson",
		overview = "full",
		annotations = ["distance", "duration", "speed"],
		voice_instructions = true,
		banner_instructions = true,
	} = options;

	const getDirections = useCallback(
		async (
			origin: Coordinate,
			destination: Coordinate,
			waypoints: Coordinate[] = [],
		) => {
			if (!MAPBOX_ACCESS_TOKEN) {
				setError("Mapbox access token not configured");
				return null;
			}

			setLoading(true);
			setError(null);

			try {
				// Build coordinates string: origin;waypoint1;waypoint2;...;destination
				const allCoordinates = [origin, ...waypoints, destination];

				const coordinatesString = allCoordinates
					.map((coord) => `${coord.longitude},${coord.latitude}`)
					.join(";");

				const params = new URLSearchParams({
					access_token: MAPBOX_ACCESS_TOKEN,
					language,
					alternatives: String(alternatives),
					steps: String(steps),
					geometries,
					overview,
					annotations: annotations.join(","),
					voice_instructions: String(voice_instructions),
					banner_instructions: String(banner_instructions),
				});

				const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}?${params}`;

				const response = await fetch(url);
				const data: DirectionsResponse = await response.json();

				if (data.code !== "Ok") {
					throw new Error(`Directions API error: ${data.code}`);
				}

				if (data.routes.length === 0) {
					throw new Error("No routes found");
				}

				setRoutes(data.routes);
				setRoute(data.routes[0]);
				setLoading(false);

				return data.routes[0];
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Unknown error fetching directions";
				setError(errorMessage);
				setLoading(false);
				console.error("[useMapboxDirections] Error:", errorMessage);
				return null;
			}
		},
		[
			profile,
			language,
			alternatives,
			steps,
			geometries,
			overview,
			annotations,
			voice_instructions,
			banner_instructions,
		],
	);

	const clearRoute = useCallback(() => {
		setRoute(null);
		setRoutes([]);
		setError(null);
	}, []);

	return {
		route,
		routes,
		loading,
		error,
		getDirections,
		clearRoute,
	};
}
