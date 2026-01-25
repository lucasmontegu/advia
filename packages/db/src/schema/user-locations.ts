import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const userLocation = pgTable(
	"user_location",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
		longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
		isPrimary: boolean("is_primary").default(false).notNull(),
		notifyAlerts: boolean("notify_alerts").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("user_location_userId_idx").on(table.userId),
		index("user_location_coords_idx").on(table.latitude, table.longitude),
	],
);

export const userLocationRelations = relations(userLocation, ({ one }) => ({
	user: one(users, {
		fields: [userLocation.userId],
		references: [users.id],
	}),
}));
