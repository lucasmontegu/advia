import { z } from "zod";
import { db } from "@advia/db";
import { safePlacesCache, apiUsage, type SafePlace, type PlaceType } from "@advia/db/schema/index";
import { eq, and, gt, sql } from "drizzle-orm";
import { protectedProcedure } from "../index";
import { env } from "@advia/env/server";

const MAPBOX_API_BASE = "https://api.mapbox.com/search/searchbox/v1";

// Mapbox category to our place type mapping
const CATEGORY_MAP: Record<string, PlaceType> = {
  gas_station: "gas_station",
  fuel: "gas_station",
  petrol_station: "gas_station",
  rest_area: "rest_area",
  parking: "rest_area",
  truck_stop: "rest_area",
  town: "town",
  city: "town",
  village: "town",
  place: "town",
};

// POI categories to search for each place type
const SEARCH_CATEGORIES: Record<PlaceType, string[]> = {
  gas_station: ["gas_station", "fuel"],
  rest_area: ["rest_area", "parking"],
  town: ["place"],
};

// Helper to generate IDs
function generateId(): string {
  return crypto.randomUUID();
}

// Get grid coordinates for cache lookup
function getCacheKey(lat: number, lng: number, radiusKm: number): string {
  const gridLat = Math.round(lat * 100) / 100;
  const gridLng = Math.round(lng * 100) / 100;
  return `places:${gridLat}:${gridLng}:${radiusKm}`;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Track API usage
async function trackApiUsage(endpoint: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0]!;
  const id = `mapbox:${today}:${endpoint}`;

  try {
    await db
      .insert(apiUsage)
      .values({
        id,
        date: today,
        provider: "mapbox",
        endpoint,
        callCount: 1,
      })
      .onConflictDoUpdate({
        target: apiUsage.id,
        set: {
          callCount: sql`${apiUsage.callCount} + 1`,
        },
      });
  } catch (error) {
    console.error("Failed to track API usage:", error);
  }
}

// Fetch places from Mapbox Search API
async function fetchFromMapbox(
  lat: number,
  lng: number,
  radiusKm: number,
  categories: string[]
): Promise<SafePlace[]> {
  const token = env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn("MAPBOX_ACCESS_TOKEN not configured, using fallback");
    return [];
  }

  const places: SafePlace[] = [];

  for (const category of categories) {
    try {
      const url = new URL(`${MAPBOX_API_BASE}/category/${category}`);
      url.searchParams.set("access_token", token);
      url.searchParams.set("proximity", `${lng},${lat}`);
      url.searchParams.set("limit", "10");
      url.searchParams.set("language", "es");

      const response = await fetch(url.toString());
      await trackApiUsage("searchbox/category");

      if (!response.ok) {
        console.error(`Mapbox API error for ${category}:`, response.status);
        continue;
      }

      const data = (await response.json()) as { features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: {
          mapbox_id?: string;
          name?: string;
          full_address?: string;
          place_formatted?: string;
        };
      }> };
      const features = data.features || [];

      for (const feature of features) {
        const coords = feature.geometry?.coordinates;
        if (!coords) continue;

        const [featureLng, featureLat] = coords;
        const distance = calculateDistance(lat, lng, featureLat, featureLng);

        // Only include places within radius
        if (distance > radiusKm) continue;

        const placeType = CATEGORY_MAP[category] || "rest_area";

        places.push({
          id: feature.properties?.mapbox_id || generateId(),
          name: feature.properties?.name || "Unknown",
          type: placeType,
          latitude: featureLat,
          longitude: featureLng,
          address: feature.properties?.full_address || feature.properties?.place_formatted,
          distanceKm: Math.round(distance * 10) / 10,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch ${category} from Mapbox:`, error);
    }
  }

  // Sort by distance
  places.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  return places;
}

// Fallback: Generate nearby towns based on grid (when Mapbox unavailable)
function generateFallbackPlaces(lat: number, lng: number, radiusKm: number): SafePlace[] {
  // This is a simple fallback - in production you might use OSM Overpass API
  const places: SafePlace[] = [];

  // Generate some placeholder points in cardinal directions
  const offsets = [
    { name: "Localidad cercana (Norte)", latOff: 0.1, lngOff: 0 },
    { name: "Localidad cercana (Sur)", latOff: -0.1, lngOff: 0 },
    { name: "Localidad cercana (Este)", latOff: 0, lngOff: 0.1 },
    { name: "Localidad cercana (Oeste)", latOff: 0, lngOff: -0.1 },
  ];

  for (const offset of offsets) {
    const placeLat = lat + offset.latOff;
    const placeLng = lng + offset.lngOff;
    const distance = calculateDistance(lat, lng, placeLat, placeLng);

    if (distance <= radiusKm) {
      places.push({
        id: generateId(),
        name: offset.name,
        type: "town",
        latitude: placeLat,
        longitude: placeLng,
        distanceKm: Math.round(distance * 10) / 10,
      });
    }
  }

  return places;
}

export const placesRouter = {
  // Get safe places nearby
  getSafePlaces: protectedProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(100).default(20),
        types: z
          .array(z.enum(["gas_station", "rest_area", "town"]))
          .optional()
          .default(["gas_station", "rest_area", "town"]),
      })
    )
    .handler(async ({ input }) => {
      const { lat, lng, radiusKm, types } = input;
      const cacheId = getCacheKey(lat, lng, radiusKm);

      // Check cache first (24-48 hour TTL for places)
      const cached = await db
        .select()
        .from(safePlacesCache)
        .where(
          and(eq(safePlacesCache.id, cacheId), gt(safePlacesCache.expiresAt, new Date()))
        )
        .limit(1);

      let allPlaces: SafePlace[];

      if (cached.length > 0 && cached[0]?.places) {
        allPlaces = cached[0].places;
      } else {
        // Fetch from Mapbox
        const categories = types.flatMap((type) => SEARCH_CATEGORIES[type] || []);
        allPlaces = await fetchFromMapbox(lat, lng, radiusKm, categories);

        // If no results from Mapbox, use fallback
        if (allPlaces.length === 0) {
          allPlaces = generateFallbackPlaces(lat, lng, radiusKm);
        }

        // Cache for 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db
          .insert(safePlacesCache)
          .values({
            id: cacheId,
            latitude: lat.toString(),
            longitude: lng.toString(),
            radiusKm: radiusKm.toString(),
            places: allPlaces,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: safePlacesCache.id,
            set: {
              places: allPlaces,
              fetchedAt: new Date(),
              expiresAt,
            },
          });
      }

      // Filter by requested types
      const filteredPlaces = allPlaces.filter((place) =>
        types.includes(place.type)
      );

      // Group by type for easier consumption
      const grouped = {
        gas_stations: filteredPlaces.filter((p) => p.type === "gas_station"),
        rest_areas: filteredPlaces.filter((p) => p.type === "rest_area"),
        towns: filteredPlaces.filter((p) => p.type === "town"),
      };

      return {
        places: filteredPlaces,
        grouped,
        count: filteredPlaces.length,
        radiusKm,
        fetchedAt: new Date(),
      };
    }),
};
