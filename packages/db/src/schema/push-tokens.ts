import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const pushToken = pgTable(
	"push_token",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		platform: text("platform").notNull().$type<"ios" | "android">(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("push_token_userId_idx").on(table.userId),
		index("push_token_token_idx").on(table.token),
	],
);

export const pushTokenRelations = relations(pushToken, ({ one }) => ({
	user: one(users, {
		fields: [pushToken.userId],
		references: [users.id],
	}),
}));
