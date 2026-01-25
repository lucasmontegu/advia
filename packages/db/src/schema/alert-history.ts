import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export type AlertType =
	| "tornado"
	| "hail"
	| "thunderstorm"
	| "flood"
	| "hurricane"
	| "winter_storm"
	| "extreme_wind"
	| "extreme_heat"
	| "extreme_cold"
	| "other";

export type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";

export type AlertSource = "noaa" | "smn" | "tomorrow";

export type GeoJSONPolygon = {
	type: "Polygon";
	coordinates: number[][][];
};

export const alertHistory = pgTable(
	"alert_history",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		externalId: text("external_id"), // ID from the weather API
		alertType: text("alert_type").notNull().$type<AlertType>(),
		severity: text("severity").notNull().$type<AlertSeverity>(),
		title: text("title").notNull(),
		description: text("description"),
		instructions: text("instructions"),
		source: text("source").notNull().$type<AlertSource>(),
		latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
		longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
		polygon: jsonb("polygon").$type<GeoJSONPolygon>(),
		notifiedAt: timestamp("notified_at"),
		startsAt: timestamp("starts_at"),
		expiresAt: timestamp("expires_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("alert_history_userId_idx").on(table.userId),
		index("alert_history_externalId_idx").on(table.externalId),
		index("alert_history_createdAt_idx").on(table.createdAt),
		index("alert_history_severity_idx").on(table.severity),
	],
);

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
	user: one(users, {
		fields: [alertHistory.userId],
		references: [users.id],
	}),
}));
