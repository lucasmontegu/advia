// packages/api/src/routers/routes.ts

import { db } from "@driwet/db";
import { savedRoute, tripHistory } from "@driwet/db/schema/routes";
import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const routesRouter = {
	// ============ Saved Routes ============

	listSaved: protectedProcedure.handler(async ({ context }) => {
		const routes = await db.query.savedRoute.findMany({
			where: eq(savedRoute.userId, context.session.user.id),
			orderBy: [desc(savedRoute.isFavorite), desc(savedRoute.updatedAt)],
		});
		return routes;
	}),

	getSaved: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const route = await db.query.savedRoute.findFirst({
				where: and(
					eq(savedRoute.id, input.id),
					eq(savedRoute.userId, context.session.user.id),
				),
			});
			return route ?? null;
		}),

	createSaved: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				originName: z.string().min(1),
				originLatitude: z.number(),
				originLongitude: z.number(),
				destinationName: z.string().min(1),
				destinationLatitude: z.number(),
				destinationLongitude: z.number(),
				isFavorite: z.boolean().default(false),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();

			await db.insert(savedRoute).values({
				id,
				userId: context.session.user.id,
				name: input.name,
				originName: input.originName,
				originLatitude: input.originLatitude.toString(),
				originLongitude: input.originLongitude.toString(),
				destinationName: input.destinationName,
				destinationLatitude: input.destinationLatitude.toString(),
				destinationLongitude: input.destinationLongitude.toString(),
				isFavorite: input.isFavorite,
			});

			return { id };
		}),

	deleteSaved: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await db
				.delete(savedRoute)
				.where(
					and(
						eq(savedRoute.id, input.id),
						eq(savedRoute.userId, context.session.user.id),
					),
				);
			return { success: true };
		}),

	toggleFavorite: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const route = await db.query.savedRoute.findFirst({
				where: and(
					eq(savedRoute.id, input.id),
					eq(savedRoute.userId, context.session.user.id),
				),
			});

			if (route) {
				await db
					.update(savedRoute)
					.set({ isFavorite: !route.isFavorite })
					.where(eq(savedRoute.id, input.id));
			}

			return { success: true };
		}),

	// ============ Trip History ============

	listHistory: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(50).default(20),
					offset: z.number().min(0).default(0),
				})
				.optional(),
		)
		.handler(async ({ input, context }) => {
			const limit = input?.limit ?? 20;
			const offset = input?.offset ?? 0;

			const trips = await db.query.tripHistory.findMany({
				where: eq(tripHistory.userId, context.session.user.id),
				orderBy: [desc(tripHistory.startedAt)],
				limit,
				offset,
				with: {
					savedRoute: true,
				},
			});
			return trips;
		}),

	recordTrip: protectedProcedure
		.input(
			z.object({
				savedRouteId: z.string().optional(),
				originName: z.string().min(1),
				originLatitude: z.number(),
				originLongitude: z.number(),
				destinationName: z.string().min(1),
				destinationLatitude: z.number(),
				destinationLongitude: z.number(),
				distanceKm: z.number().optional(),
				durationMinutes: z.number().optional(),
				weatherCondition: z
					.enum(["clear", "rain", "storm", "snow", "fog"])
					.optional(),
				outcome: z
					.enum([
						"completed",
						"avoided_storm",
						"encountered_weather",
						"cancelled",
					])
					.default("completed"),
				alertsAvoidedCount: z.number().default(0),
				estimatedSavings: z.number().default(0),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();

			await db.insert(tripHistory).values({
				id,
				userId: context.session.user.id,
				savedRouteId: input.savedRouteId,
				originName: input.originName,
				originLatitude: input.originLatitude.toString(),
				originLongitude: input.originLongitude.toString(),
				destinationName: input.destinationName,
				destinationLatitude: input.destinationLatitude.toString(),
				destinationLongitude: input.destinationLongitude.toString(),
				distanceKm: input.distanceKm?.toString(),
				durationMinutes: input.durationMinutes,
				weatherCondition: input.weatherCondition,
				outcome: input.outcome,
				alertsAvoidedCount: input.alertsAvoidedCount,
				estimatedSavings: input.estimatedSavings.toString(),
				completedAt: new Date(),
			});

			return { id };
		}),

	// ============ Gamification Stats ============

	getStats: protectedProcedure.handler(async ({ context }) => {
		// Calculate aggregated stats from trip history
		const stats = await db
			.select({
				totalTrips: sql<number>`count(*)`.as("total_trips"),
				stormsAvoided: sql<number>`sum(${tripHistory.alertsAvoidedCount})`.as(
					"storms_avoided",
				),
				totalSavings:
					sql<number>`sum(cast(${tripHistory.estimatedSavings} as numeric))`.as(
						"total_savings",
					),
				totalDistance:
					sql<number>`sum(cast(${tripHistory.distanceKm} as numeric))`.as(
						"total_distance",
					),
			})
			.from(tripHistory)
			.where(eq(tripHistory.userId, context.session.user.id));

		const result = stats[0];

		return {
			totalTrips: Number(result?.totalTrips) || 0,
			stormsAvoided: Number(result?.stormsAvoided) || 0,
			moneySaved: Number(result?.totalSavings) || 0,
			kmTraveled: Number(result?.totalDistance) || 0,
		};
	}),
};
