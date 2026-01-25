import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	role: text("role"),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	// User preferences
	theme: text("theme").default("auto").notNull(), // 'light' | 'dark' | 'auto'
	language: text("language").default("es").notNull(), // 'en' | 'es'
	notificationsEnabled: boolean("notifications_enabled")
		.default(true)
		.notNull(),
	// Onboarding state
	onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
	tripPreferences: text("trip_preferences"), // JSON array of trip types from onboarding
	// Subscription status (synced via RevenueCat webhooks)
	isPremium: boolean("is_premium").default(false).notNull(),
	subscriptionStatus: text("subscription_status"), // 'active' | 'cancelled' | 'expired' | 'grace_period' | null
	subscriptionProductId: text("subscription_product_id"), // e.g., 'monthly', 'yearly', 'lifetime'
	subscriptionExpiresAt: timestamp("subscription_expires_at"),
	revenuecatCustomerId: text("revenuecat_customer_id"), // RevenueCat's customer ID for reference
});

export const sessions = pgTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),
		activeOrganizationId: text("active_organization_id"),
		activeTeamId: text("active_team_id"),
	},
	(table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const organizations = pgTable(
	"organizations",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		logo: text("logo"),
		createdAt: timestamp("created_at").notNull(),
		metadata: text("metadata"),
	},
	(table) => [uniqueIndex("organizations_slug_uidx").on(table.slug)],
);

export const teams = pgTable(
	"teams",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull(),
		updatedAt: timestamp("updated_at").$onUpdate(
			() => /* @__PURE__ */ new Date(),
		),
	},
	(table) => [index("teams_organizationId_idx").on(table.organizationId)],
);

export const teamMembers = pgTable(
	"team_members",
	{
		id: text("id").primaryKey(),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at"),
	},
	(table) => [
		index("teamMembers_teamId_idx").on(table.teamId),
		index("teamMembers_userId_idx").on(table.userId),
	],
);

export const members = pgTable(
	"members",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").default("member").notNull(),
		createdAt: timestamp("created_at").notNull(),
	},
	(table) => [
		index("members_organizationId_idx").on(table.organizationId),
		index("members_userId_idx").on(table.userId),
	],
);

export const invitations = pgTable(
	"invitations",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		role: text("role"),
		teamId: text("team_id"),
		status: text("status").default("pending").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		inviterId: text("inviter_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("invitations_organizationId_idx").on(table.organizationId),
		index("invitations_email_idx").on(table.email),
	],
);

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	teamMembers: many(teamMembers),
	members: many(members),
	invitations: many(invitations),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	users: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	users: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	teams: many(teams),
	members: many(members),
	invitations: many(invitations),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
	organizations: one(organizations, {
		fields: [teams.organizationId],
		references: [organizations.id],
	}),
	teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	teams: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
	users: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
}));

export const membersRelations = relations(members, ({ one }) => ({
	organizations: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id],
	}),
	users: one(users, {
		fields: [members.userId],
		references: [users.id],
	}),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
	organizations: one(organizations, {
		fields: [invitations.organizationId],
		references: [organizations.id],
	}),
	users: one(users, {
		fields: [invitations.inviterId],
		references: [users.id],
	}),
}));

/* // Better Auth expects singular table names - add aliases
export const user = users;
export const session = sessions;
export const account = accounts;
export const verification = verifications;
export const organization = organizations;
export const team = teams;
export const teamMember = teamMembers;
export const member = members;
export const invitation = invitations; */
