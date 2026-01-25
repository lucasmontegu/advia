import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// B2B fleet plans
export const fleetPlanEnum = pgEnum("fleet_plan", [
	"starter",
	"pro",
	"business",
	"enterprise",
]);

// Fleet member roles
export const fleetRoleEnum = pgEnum("fleet_role", ["owner", "admin", "viewer"]);

// Vehicle status
export const vehicleStatusEnum = pgEnum("vehicle_status", [
	"active",
	"inactive",
]);

// Fleet table (B2B customers with vehicle fleets)
export const fleet = pgTable("fleet", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	plan: fleetPlanEnum("plan").default("starter").notNull(),
	billingEmail: text("billing_email"),
	maxVehicles: integer("max_vehicles").default(25).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Fleet members (users belonging to a fleet)
export const fleetMember = pgTable(
	"fleet_member",
	{
		id: text("id").primaryKey(),
		fleetId: text("fleet_id")
			.notNull()
			.references(() => fleet.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: fleetRoleEnum("role").default("viewer").notNull(),
		invitedAt: timestamp("invited_at").defaultNow().notNull(),
		joinedAt: timestamp("joined_at"),
	},
	(table) => [
		index("fleet_member_fleet_idx").on(table.fleetId),
		index("fleet_member_user_idx").on(table.userId),
	],
);

// Vehicles in a fleet
export const vehicle = pgTable(
	"vehicle",
	{
		id: text("id").primaryKey(),
		fleetId: text("fleet_id")
			.notNull()
			.references(() => fleet.id, { onDelete: "cascade" }),
		plate: text("plate").notNull(),
		label: text("label"), // Optional friendly name (e.g., "Moto 15")
		assignedUserId: text("assigned_user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		status: vehicleStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("vehicle_fleet_idx").on(table.fleetId),
		index("vehicle_assigned_user_idx").on(table.assignedUserId),
	],
);

// Fleet alert history (for B2B reporting)
export const fleetAlertHistory = pgTable(
	"fleet_alert_history",
	{
		id: text("id").primaryKey(),
		fleetId: text("fleet_id")
			.notNull()
			.references(() => fleet.id, { onDelete: "cascade" }),
		alertType: text("alert_type").notNull(),
		severity: text("severity").notNull(), // low, medium, high, extreme
		vehiclesAffected: integer("vehicles_affected").default(0).notNull(),
		managedAt: timestamp("managed_at"),
		managedBy: text("managed_by").references(() => users.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("fleet_alert_fleet_idx").on(table.fleetId),
		index("fleet_alert_created_idx").on(table.createdAt),
	],
);

// Relations
export const fleetRelations = relations(fleet, ({ many }) => ({
	members: many(fleetMember),
	vehicles: many(vehicle),
	alertHistory: many(fleetAlertHistory),
}));

export const fleetMemberRelations = relations(fleetMember, ({ one }) => ({
	fleet: one(fleet, {
		fields: [fleetMember.fleetId],
		references: [fleet.id],
	}),
	user: one(users, {
		fields: [fleetMember.userId],
		references: [users.id],
	}),
}));

export const vehicleRelations = relations(vehicle, ({ one }) => ({
	fleet: one(fleet, {
		fields: [vehicle.fleetId],
		references: [fleet.id],
	}),
	assignedUser: one(users, {
		fields: [vehicle.assignedUserId],
		references: [users.id],
	}),
}));

export const fleetAlertHistoryRelations = relations(
	fleetAlertHistory,
	({ one }) => ({
		fleet: one(fleet, {
			fields: [fleetAlertHistory.fleetId],
			references: [fleet.id],
		}),
		managedByUser: one(users, {
			fields: [fleetAlertHistory.managedBy],
			references: [users.id],
		}),
	}),
);
