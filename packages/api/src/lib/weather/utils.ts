import { db } from "@driwet/db";
import { apiUsage } from "@driwet/db/schema/index";
import { and, eq, sql } from "drizzle-orm";
import type { ApiProvider, RoadRisk, WeatherData } from "./types";

// Weather code to precipitation type mapping (shared across providers)
export const PRECIPITATION_MAP: Record<
	number,
	WeatherData["precipitationType"]
> = {
	// Tomorrow.io codes
	4000: "rain", // Drizzle
	4001: "rain", // Rain
	4200: "rain", // Light Rain
	4201: "rain", // Heavy Rain
	5000: "snow", // Snow
	5001: "snow", // Flurries
	5100: "snow", // Light Snow
	5101: "snow", // Heavy Snow
	6000: "rain", // Freezing Drizzle
	6001: "rain", // Freezing Rain
	6200: "rain", // Light Freezing Rain
	6201: "rain", // Heavy Freezing Rain
	7000: "hail", // Ice Pellets
	7101: "hail", // Heavy Ice Pellets
	7102: "hail", // Light Ice Pellets
	// OpenWeather codes (2xx-8xx range)
	200: "rain", // Thunderstorm with light rain
	201: "rain", // Thunderstorm with rain
	202: "rain", // Thunderstorm with heavy rain
	300: "rain", // Light drizzle
	301: "rain", // Drizzle
	302: "rain", // Heavy drizzle
	500: "rain", // Light rain
	501: "rain", // Moderate rain
	502: "rain", // Heavy rain
	503: "rain", // Very heavy rain
	504: "rain", // Extreme rain
	511: "rain", // Freezing rain
	520: "rain", // Light shower rain
	521: "rain", // Shower rain
	522: "rain", // Heavy shower rain
	600: "snow", // Light snow
	601: "snow", // Snow
	602: "snow", // Heavy snow
	611: "snow", // Sleet
	612: "snow", // Light shower sleet
	613: "snow", // Shower sleet
	615: "rain", // Light rain and snow
	616: "rain", // Rain and snow
	620: "snow", // Light shower snow
	621: "snow", // Shower snow
	622: "snow", // Heavy shower snow
};

// Calculate road risk based on weather conditions
export function calculateRoadRisk(data: {
	precipitationIntensity: number;
	windSpeed: number;
	windGust: number;
	visibility: number;
	weatherCode: number;
}): RoadRisk {
	const {
		precipitationIntensity,
		windSpeed,
		windGust,
		visibility,
		weatherCode,
	} = data;

	// Extreme conditions
	if (
		windGust > 80 ||
		visibility < 0.5 ||
		[8000, 202, 503, 504].includes(weatherCode) // Thunderstorm/extreme rain
	) {
		return "extreme";
	}

	// High risk conditions
	if (
		precipitationIntensity > 10 ||
		windSpeed > 60 ||
		windGust > 60 ||
		visibility < 1 ||
		[7000, 7101, 7102].includes(weatherCode) // Hail
	) {
		return "high";
	}

	// Moderate risk
	if (
		precipitationIntensity > 2 ||
		windSpeed > 40 ||
		visibility < 3 ||
		[5000, 5001, 5100, 5101, 600, 601, 602].includes(weatherCode) // Snow
	) {
		return "moderate";
	}

	return "low";
}

// Get precipitation type from weather code
export function getPrecipitationType(
	weatherCode: number,
	precipIntensity: number,
): WeatherData["precipitationType"] {
	return (
		PRECIPITATION_MAP[weatherCode] || (precipIntensity > 0 ? "rain" : "none")
	);
}

// Cache key generation using grid-based coordinates (~1km precision)
export function getCacheKey(lat: number, lng: number): string {
	const gridLat = Math.round(lat * 100) / 100;
	const gridLng = Math.round(lng * 100) / 100;
	return `${gridLat}:${gridLng}`;
}

// Get grid coordinates
export function getGridCoords(lat: number, lng: number) {
	return {
		gridLat: (Math.round(lat * 100) / 100).toString(),
		gridLng: (Math.round(lng * 100) / 100).toString(),
	};
}

// Dynamic TTL based on weather risk
export function getCacheTTL(risk: RoadRisk): number {
	switch (risk) {
		case "extreme":
			return 2 * 60 * 1000; // 2 minutes
		case "high":
			return 5 * 60 * 1000; // 5 minutes
		case "moderate":
			return 10 * 60 * 1000; // 10 minutes
		default:
			return 15 * 60 * 1000; // 15 minutes
	}
}

// Track API usage for a provider
export async function trackApiUsage(
	provider: ApiProvider,
	endpoint: string,
): Promise<void> {
	const today = new Date().toISOString().split("T")[0]!;
	const id = `${provider}:${today}:${endpoint}`;

	try {
		await db
			.insert(apiUsage)
			.values({
				id,
				date: today,
				provider,
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
		console.error(`Failed to track API usage for ${provider}:`, error);
	}
}

// Check API limit for a provider
export async function checkApiLimit(
	provider: ApiProvider,
	dailyLimit: number,
): Promise<{
	remaining: number;
	exceeded: boolean;
	used: number;
}> {
	const today = new Date().toISOString().split("T")[0]!;

	const usage = await db
		.select({
			total: sql<number>`COALESCE(SUM(${apiUsage.callCount}), 0)`,
		})
		.from(apiUsage)
		.where(and(eq(apiUsage.date, today), eq(apiUsage.provider, provider)));

	const used = Number(usage[0]?.total ?? 0);
	return {
		remaining: Math.max(0, dailyLimit - used),
		exceeded: used >= dailyLimit,
		used,
	};
}

// Calculate overall risk from multiple segments
export function calculateOverallRisk(
	segments: Array<{ weather: WeatherData }>,
): RoadRisk {
	const riskPriority: Record<RoadRisk, number> = {
		low: 0,
		moderate: 1,
		high: 2,
		extreme: 3,
	};

	return segments.reduce<RoadRisk>((highest, segment) => {
		return riskPriority[segment.weather.roadRisk] > riskPriority[highest]
			? segment.weather.roadRisk
			: highest;
	}, "low");
}
