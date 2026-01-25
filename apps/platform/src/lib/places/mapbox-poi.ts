// apps/platform/src/lib/places/mapbox-poi.ts
import { env } from "@driwet/env/server";

export type SafeStop = {
	id: string;
	name: string;
	type: "gas_station" | "rest_area" | "town" | "convenience_store";
	latitude: number;
	longitude: number;
	distanceKm: number;
	address?: string;
	reason: string; // Why this is suggested (shelter, fuel, facilities)
};

type MapboxFeature = {
	id: string;
	place_name: string;
	text: string;
	center: [number, number]; // [longitude, latitude]
	properties: {
		category?: string;
		maki?: string;
	};
};

type MapboxResponse = {
	features: MapboxFeature[];
};

// Calculate distance between two points in km using Haversine formula
function haversineDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// Search for POIs using Mapbox Geocoding API
async function searchPOI(
	query: string,
	latitude: number,
	longitude: number,
	radiusKm: number,
	limit = 5,
): Promise<MapboxFeature[]> {
	const mapboxToken = env.MAPBOX_ACCESS_TOKEN;
	if (!mapboxToken) {
		console.warn("MAPBOX_ACCESS_TOKEN not configured, POI search disabled");
		return [];
	}

	const url = new URL(
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
	);
	url.searchParams.set("access_token", mapboxToken);
	url.searchParams.set("proximity", `${longitude},${latitude}`);
	url.searchParams.set("limit", limit.toString());
	url.searchParams.set("language", "es");

	const response = await fetch(url.toString());
	if (!response.ok) {
		console.error("Mapbox POI search failed:", response.statusText);
		return [];
	}

	const data: MapboxResponse = await response.json();

	// Filter by radius
	return data.features.filter((feature) => {
		const distance = haversineDistance(
			latitude,
			longitude,
			feature.center[1],
			feature.center[0],
		);
		return distance <= radiusKm;
	});
}

// Find safe stops near a location
export async function findSafeStops(
	latitude: number,
	longitude: number,
	radiusKm = 20,
	urgency: "low" | "medium" | "high" = "medium",
): Promise<SafeStop[]> {
	const stops: SafeStop[] = [];

	// Adjust search based on urgency
	const searchRadius = urgency === "high" ? Math.min(radiusKm, 10) : radiusKm;
	const limit = urgency === "high" ? 10 : 5;

	// Search for gas stations (best shelter with facilities)
	const gasStations = await searchPOI(
		"gasolinera estacion de servicio",
		latitude,
		longitude,
		searchRadius,
		limit,
	);

	for (const feature of gasStations) {
		const distance = haversineDistance(
			latitude,
			longitude,
			feature.center[1],
			feature.center[0],
		);
		stops.push({
			id: feature.id,
			name: feature.text || feature.place_name.split(",")[0] || "Gasolinera",
			type: "gas_station",
			latitude: feature.center[1],
			longitude: feature.center[0],
			distanceKm: Math.round(distance * 10) / 10,
			address: feature.place_name,
			reason: "Refugio con servicios, baños y posiblemente comida",
		});
	}

	// Search for rest areas / parking areas
	const restAreas = await searchPOI(
		"area de descanso estacionamiento parador",
		latitude,
		longitude,
		searchRadius,
		limit,
	);

	for (const feature of restAreas) {
		// Avoid duplicates
		if (stops.some((s) => s.id === feature.id)) continue;

		const distance = haversineDistance(
			latitude,
			longitude,
			feature.center[1],
			feature.center[0],
		);
		stops.push({
			id: feature.id,
			name:
				feature.text || feature.place_name.split(",")[0] || "Área de descanso",
			type: "rest_area",
			latitude: feature.center[1],
			longitude: feature.center[0],
			distanceKm: Math.round(distance * 10) / 10,
			address: feature.place_name,
			reason: "Lugar seguro para estacionar y esperar",
		});
	}

	// Search for towns/cities (for longer wait times)
	if (urgency !== "high") {
		const towns = await searchPOI(
			"pueblo ciudad",
			latitude,
			longitude,
			searchRadius,
			3,
		);

		for (const feature of towns) {
			if (stops.some((s) => s.id === feature.id)) continue;

			const distance = haversineDistance(
				latitude,
				longitude,
				feature.center[1],
				feature.center[0],
			);
			stops.push({
				id: feature.id,
				name: feature.text || feature.place_name.split(",")[0] || "Localidad",
				type: "town",
				latitude: feature.center[1],
				longitude: feature.center[0],
				distanceKm: Math.round(distance * 10) / 10,
				address: feature.place_name,
				reason: "Localidad con múltiples servicios y refugio",
			});
		}
	}

	// Sort by distance
	stops.sort((a, b) => a.distanceKm - b.distanceKm);

	// Limit results
	return stops.slice(0, urgency === "high" ? 5 : 10);
}
