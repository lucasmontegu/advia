import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { savedRoute } from "./routes";

// Weather data types
export type RoadRisk = "low" | "moderate" | "high" | "extreme";
export type WeatherSource = "tomorrow" | "openweather" | "noaa";
export type PlaceType = "gas_station" | "rest_area" | "town";

export interface WeatherData {
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
}

export interface RouteSegment {
	km: number;
	lat: number;
	lng: number;
	weather: WeatherData;
}

export interface SafePlace {
	id: string;
	name: string;
	type: PlaceType;
	latitude: number;
	longitude: number;
	address?: string;
	distanceKm?: number;
}

export interface WeatherSnapshot {
	timestamp: string;
	lat: number;
	lng: number;
	weather: WeatherData;
}

export interface TripAlert {
	id: string;
	type: string;
	severity: string;
	title: string;
	encounteredAt: string;
}

// Weather cache - stores weather data by grid location
export const weatherCache = pgTable(
	"weather_cache",
	{
		id: text("id").primaryKey(),
		latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
		longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
		data: jsonb("data").$type<WeatherData>().notNull(),
		source: text("source").$type<WeatherSource>().notNull(),
		fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at").notNull(),
	},
	(table) => [
		index("weather_cache_coords_idx").on(table.latitude, table.longitude),
		index("weather_cache_expires_idx").on(table.expiresAt),
	],
);

// Route weather analysis - stores analysis of weather along routes
export const routeWeatherAnalysis = pgTable(
	"route_weather_analysis",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		savedRouteId: text("saved_route_id").references(() => savedRoute.id, {
			onDelete: "set null",
		}),
		polyline: text("polyline").notNull(),
		segments: jsonb("segments").$type<RouteSegment[]>().notNull(),
		overallRisk: text("overall_risk").$type<RoadRisk>().notNull(),
		alerts: jsonb("alerts").$type<object[]>().default([]),
		analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
		validUntil: timestamp("valid_until").notNull(),
	},
	(table) => [
		index("route_weather_analysis_userId_idx").on(table.userId),
		index("route_weather_analysis_analyzedAt_idx").on(table.analyzedAt),
	],
);

export const routeWeatherAnalysisRelations = relations(
	routeWeatherAnalysis,
	({ one }) => ({
		user: one(users, {
			fields: [routeWeatherAnalysis.userId],
			references: [users.id],
		}),
		savedRoute: one(savedRoute, {
			fields: [routeWeatherAnalysis.savedRouteId],
			references: [savedRoute.id],
		}),
	}),
);

// Safe places cache - stores POIs for shelter
export const safePlacesCache = pgTable(
	"safe_places_cache",
	{
		id: text("id").primaryKey(),
		latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
		longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
		radiusKm: numeric("radius_km", { precision: 5, scale: 2 }).notNull(),
		places: jsonb("places").$type<SafePlace[]>().notNull(),
		fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at").notNull(),
	},
	(table) => [
		index("safe_places_cache_coords_idx").on(
			table.latitude,
			table.longitude,
			table.radiusKm,
		),
	],
);

// API usage tracking
export type ApiProvider = "tomorrow" | "openweather" | "mapbox";

export const apiUsage = pgTable(
	"api_usage",
	{
		id: text("id").primaryKey(),
		date: date("date").notNull(),
		provider: text("provider").$type<ApiProvider>().notNull(),
		endpoint: text("endpoint").notNull(),
		callCount: integer("call_count").default(1).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("api_usage_date_provider_idx").on(table.date, table.provider),
	],
);
