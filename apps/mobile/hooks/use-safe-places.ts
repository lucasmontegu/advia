// apps/mobile/hooks/use-safe-places.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";
import { Analytics } from "@/lib/analytics";
import { api } from "@/lib/query-client";
import {
	buildNavigationURL,
	safeOpenURL,
	sanitizeCoordinates,
} from "@/lib/url-security";

// ============ Safe Places Types ============

export type PlaceType = "gas_station" | "rest_area" | "town";

export type SafePlace = {
	id: string;
	name: string;
	type: PlaceType;
	latitude: number;
	longitude: number;
	address?: string;
	distanceKm?: number;
};

export type SafePlacesResult = {
	places: SafePlace[];
	grouped: {
		gas_stations: SafePlace[];
		rest_areas: SafePlace[];
		towns: SafePlace[];
	};
	count: number;
	radiusKm: number;
	fetchedAt: Date;
};

// ============ Safe Places Hooks ============

/**
 * Fetch safe places (shelters) near a location.
 * Used when dangerous weather is detected to show refuge options.
 */
export function useSafePlaces(
	lat: number,
	lng: number,
	options: {
		radiusKm?: number;
		types?: PlaceType[];
		enabled?: boolean;
	} = {},
) {
	const { radiusKm = 20, types, enabled = true } = options;

	return useQuery({
		...api.places.getSafePlaces.queryOptions({
			input: {
				lat,
				lng,
				radiusKm,
				types: types || ["gas_station", "rest_area", "town"],
			},
		}),
		enabled: enabled && lat !== 0 && lng !== 0,
		staleTime: 1000 * 60 * 30, // 30 minutes - places don't change often
	});
}

/**
 * Find the nearest safe place of any type
 */
export function useNearestSafePlace(lat: number, lng: number, enabled = true) {
	const query = useSafePlaces(lat, lng, { enabled });

	const nearest = query.data?.places[0] || null;

	return {
		...query,
		data: nearest,
	};
}

// ============ Navigation Utilities ============

/**
 * Open navigation to a place using external apps (Waze, Google Maps, Apple Maps)
 */
export async function navigateToPlace(
	place: SafePlace,
	preferredApp: "waze" | "google" | "apple" = "waze",
): Promise<boolean> {
	const { latitude, longitude } = place;

	// Validate coordinates before building URLs
	const coords = sanitizeCoordinates(latitude, longitude);
	if (!coords) {
		console.error("[Security] Invalid coordinates for navigation");
		return false;
	}

	// Build validated URLs
	const urls: Record<"waze" | "google" | "apple", string | null> = {
		waze: buildNavigationURL("waze", coords.latitude, coords.longitude),
		google: buildNavigationURL("google", coords.latitude, coords.longitude),
		apple: buildNavigationURL("apple", coords.latitude, coords.longitude),
	};

	// Try preferred app first
	const preferredUrl = urls[preferredApp];
	if (preferredUrl && (await safeOpenURL(preferredUrl))) {
		return true;
	}

	// Fallback order: Waze -> Google -> Apple (or Google on Android)
	const fallbackOrder: ("waze" | "google" | "apple")[] =
		Platform.OS === "ios" ? ["waze", "google", "apple"] : ["waze", "google"];

	for (const app of fallbackOrder) {
		if (app === preferredApp) continue; // Already tried
		const url = urls[app];
		if (url && (await safeOpenURL(url))) {
			return true;
		}
	}

	// Last resort: try Google Maps web
	const googleUrl = urls.google;
	if (googleUrl) {
		return await safeOpenURL(googleUrl);
	}

	return false;
}

/**
 * Hook for navigating to a place with loading state
 */
export function useNavigateToPlace() {
	return useMutation({
		mutationFn: async (params: {
			place: SafePlace;
			preferredApp?: "waze" | "google" | "apple";
		}) => {
			const success = await navigateToPlace(params.place, params.preferredApp);
			if (!success) {
				throw new Error("No se pudo abrir la navegación");
			}
			// Track successful navigation to shelter
			Analytics.shelterNavigated(params.place.type);
			return success;
		},
	});
}

// ============ Place Type Utilities ============

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
	gas_station: "Estación de servicio",
	rest_area: "Área de descanso",
	town: "Localidad",
};

export const PLACE_TYPE_ICONS: Record<PlaceType, string> = {
	gas_station: "⛽",
	rest_area: "🅿️",
	town: "🏘️",
};

export function getPlaceTypeLabel(type: PlaceType): string {
	return PLACE_TYPE_LABELS[type];
}

export function getPlaceTypeIcon(type: PlaceType): string {
	return PLACE_TYPE_ICONS[type];
}
