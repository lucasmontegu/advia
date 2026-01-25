import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import type { RoadRisk, TripAlert, WeatherSnapshot } from "./weather";

// Saved routes (e.g., "Home to Work")
export const savedRoute = pgTable(
	"saved_route",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		originName: text("origin_name").notNull(),
		originLatitude: numeric("origin_latitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		originLongitude: numeric("origin_longitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		destinationName: text("destination_name").notNull(),
		destinationLatitude: numeric("destination_latitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		destinationLongitude: numeric("destination_longitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		isFavorite: boolean("is_favorite").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("saved_route_userId_idx").on(table.userId)],
);

export const savedRouteRelations = relations(savedRoute, ({ one, many }) => ({
	user: one(users, {
		fields: [savedRoute.userId],
		references: [users.id],
	}),
	trips: many(tripHistory),
}));

// Trip history with weather conditions
export type TripWeatherCondition = "clear" | "rain" | "storm" | "snow" | "fog";
export type TripOutcome =
	| "completed"
	| "avoided_storm"
	| "encountered_weather"
	| "cancelled";

export const tripHistory = pgTable(
	"trip_history",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		savedRouteId: text("saved_route_id").references(() => savedRoute.id, {
			onDelete: "set null",
		}),
		originName: text("origin_name").notNull(),
		originLatitude: numeric("origin_latitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		originLongitude: numeric("origin_longitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		destinationName: text("destination_name").notNull(),
		destinationLatitude: numeric("destination_latitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		destinationLongitude: numeric("destination_longitude", {
			precision: 10,
			scale: 7,
		}).notNull(),
		distanceKm: numeric("distance_km", { precision: 8, scale: 2 }),
		durationMinutes: integer("duration_minutes"),
		weatherCondition: text("weather_condition").$type<TripWeatherCondition>(),
		outcome: text("outcome")
			.$type<TripOutcome>()
			.notNull()
			.default("completed"),
		alertsAvoidedCount: integer("alerts_avoided_count").default(0).notNull(),
		estimatedSavings: numeric("estimated_savings", {
			precision: 10,
			scale: 2,
		}).default("0"),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		// Weather tracking during trip
		weatherSnapshots: jsonb("weather_snapshots").$type<WeatherSnapshot[]>(),
		maxRiskEncountered: text("max_risk_encountered").$type<RoadRisk>(),
		alertsEncountered: jsonb("alerts_encountered").$type<TripAlert[]>(),
	},
	(table) => [
		index("trip_history_userId_idx").on(table.userId),
		index("trip_history_savedRouteId_idx").on(table.savedRouteId),
		index("trip_history_startedAt_idx").on(table.startedAt),
		index("trip_history_outcome_idx").on(table.outcome),
	],
);

export const tripHistoryRelations = relations(tripHistory, ({ one }) => ({
	user: one(users, {
		fields: [tripHistory.userId],
		references: [users.id],
	}),
	savedRoute: one(savedRoute, {
		fields: [tripHistory.savedRouteId],
		references: [savedRoute.id],
	}),
}));
