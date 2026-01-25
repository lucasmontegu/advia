// apps/mobile/hooks/use-place-search.ts
// Hook for searching places using Mapbox Geocoding API

import { env } from "@driwet/env/mobile";
import { useCallback, useRef, useState } from "react";

export type PlaceResult = {
	id: string;
	name: string;
	fullAddress: string;
	latitude: number;
	longitude: number;
};

type MapboxFeature = {
	id: string;
	place_name: string;
	center: [number, number]; // [longitude, latitude]
	text: string;
};

type UsePlaceSearchOptions = {
	debounceMs?: number;
	minChars?: number;
	limit?: number;
	userLocation?: { latitude: number; longitude: number } | null;
};

/**
 * Hook for searching places using Mapbox Geocoding API.
 * Returns search results with debounced fetching.
 */
export function usePlaceSearch(options: UsePlaceSearchOptions = {}) {
	const { debounceMs = 300, minChars = 2, limit = 5, userLocation } = options;

	const [results, setResults] = useState<PlaceResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const search = useCallback(
		(query: string) => {
			// Clear previous timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Clear results if query is too short
			if (query.length < minChars) {
				setResults([]);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(null);

			// Debounce the search
			timeoutRef.current = setTimeout(async () => {
				abortControllerRef.current = new AbortController();

				try {
					let url =
						`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
						`access_token=${env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&` +
						"types=place,locality,region,country,address,poi&" +
						"language=es&" +
						`limit=${limit}`;

					// Bias results to user location if available
					if (userLocation) {
						url += `&proximity=${userLocation.longitude},${userLocation.latitude}`;
					}

					const response = await fetch(url, {
						signal: abortControllerRef.current.signal,
					});

					if (!response.ok) {
						throw new Error("Failed to fetch places");
					}

					const data = await response.json();
					const features: MapboxFeature[] = data.features || [];

					const places: PlaceResult[] = features.map((feature) => ({
						id: feature.id,
						name: feature.text,
						fullAddress: feature.place_name,
						latitude: feature.center[1],
						longitude: feature.center[0],
					}));

					setResults(places);
				} catch (err) {
					if (err instanceof Error && err.name === "AbortError") {
						// Request was cancelled, ignore
						return;
					}
					console.error("Place search error:", err);
					setError("Error al buscar lugares");
					setResults([]);
				} finally {
					setIsLoading(false);
				}
			}, debounceMs);
		},
		[debounceMs, minChars, limit, userLocation],
	);

	const clear = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		setResults([]);
		setIsLoading(false);
		setError(null);
	}, []);

	return {
		results,
		isLoading,
		error,
		search,
		clear,
	};
}
