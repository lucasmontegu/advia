import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export type ChatMessage = {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	toolCalls?: {
		id: string;
		name: string;
		args: Record<string, unknown>;
		result?: unknown;
	}[];
	createdAt: string;
};

export const chatSession = pgTable(
	"chat_session",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		messages: jsonb("messages").$type<ChatMessage[]>().default([]).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("chat_session_userId_idx").on(table.userId),
		index("chat_session_updatedAt_idx").on(table.updatedAt),
	],
);

export const chatSessionRelations = relations(chatSession, ({ one }) => ({
	user: one(users, {
		fields: [chatSession.userId],
		references: [users.id],
	}),
}));
