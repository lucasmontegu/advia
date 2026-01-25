import { db } from "@driwet/db";
import { users } from "@driwet/db/schema/auth";
import { tripHistory } from "@driwet/db/schema/routes";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const userRouter = {
	getProfile: protectedProcedure.handler(async ({ context }) => {
		const userData = await db.query.users.findFirst({
			where: eq(users.id, context.session.user.id),
		});
		return userData;
	}),

	updateSettings: protectedProcedure
		.input(
			z.object({
				theme: z.enum(["light", "dark", "auto"]).optional(),
				language: z.enum(["en", "es"]).optional(),
				notificationsEnabled: z.boolean().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const updateData: Partial<{
				theme: string;
				language: string;
				notificationsEnabled: boolean;
			}> = {};

			if (input.theme !== undefined) updateData.theme = input.theme;
			if (input.language !== undefined) updateData.language = input.language;
			if (input.notificationsEnabled !== undefined)
				updateData.notificationsEnabled = input.notificationsEnabled;

			if (Object.keys(updateData).length > 0) {
				await db
					.update(users)
					.set(updateData)
					.where(eq(users.id, context.session.user.id));
			}

			return { success: true };
		}),

	completeOnboarding: protectedProcedure
		.input(
			z.object({
				tripPreferences: z.array(z.string()).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			await db
				.update(users)
				.set({
					onboardingCompleted: true,
					tripPreferences: input.tripPreferences
						? JSON.stringify(input.tripPreferences)
						: null,
				})
				.where(eq(users.id, context.session.user.id));

			return { success: true };
		}),

	getStats: protectedProcedure.handler(async ({ context }) => {
		// Calculate real stats from trip history
		const stats = await db
			.select({
				stormsAvoided:
					sql<number>`coalesce(sum(${tripHistory.alertsAvoidedCount}), 0)`.as(
						"storms_avoided",
					),
				moneySaved:
					sql<number>`coalesce(sum(cast(${tripHistory.estimatedSavings} as numeric)), 0)`.as(
						"money_saved",
					),
				kmTraveled:
					sql<number>`coalesce(sum(cast(${tripHistory.distanceKm} as numeric)), 0)`.as(
						"km_traveled",
					),
			})
			.from(tripHistory)
			.where(eq(tripHistory.userId, context.session.user.id));

		const result = stats[0];

		return {
			stormsAvoided: Number(result?.stormsAvoided) || 0,
			moneySaved: Number(result?.moneySaved) || 0,
			kmTraveled: Number(result?.kmTraveled) || 0,
		};
	}),
};
