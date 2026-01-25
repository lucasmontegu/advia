// packages/api/src/routers/subscription.ts
// Server-side subscription status from RevenueCat webhooks

import { db } from "@driwet/db";
import { users } from "@driwet/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const subscriptionRouter = {
	/**
	 * Get subscription status from database (synced via RevenueCat webhooks)
	 * This provides server-side verification of subscription status
	 */
	getStatus: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				isPremium: true,
				subscriptionStatus: true,
				subscriptionProductId: true,
				subscriptionExpiresAt: true,
			},
		});

		if (!user) {
			return {
				isPremium: false,
				subscriptionStatus: null,
				subscriptionProductId: null,
				subscriptionExpiresAt: null,
			};
		}

		return {
			isPremium: user.isPremium,
			subscriptionStatus: user.subscriptionStatus,
			subscriptionProductId: user.subscriptionProductId,
			subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
		};
	}),

	/**
	 * Manually set premium status (for testing/admin purposes)
	 * This allows you to test premium features without going through RevenueCat
	 */
	setPremiumStatus: protectedProcedure
		.input(
			z.object({
				isPremium: z.boolean(),
				productId: z.string().optional(),
				// Duration in days for the subscription (for testing)
				durationDays: z.number().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			const expiresAt = input.durationDays
				? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
				: null;

			await db
				.update(users)
				.set({
					isPremium: input.isPremium,
					subscriptionStatus: input.isPremium ? "active" : "expired",
					subscriptionProductId:
						input.productId ?? (input.isPremium ? "manual_test" : null),
					subscriptionExpiresAt: expiresAt,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));

			return {
				success: true,
				isPremium: input.isPremium,
				subscriptionStatus: input.isPremium ? "active" : "expired",
				subscriptionExpiresAt: expiresAt?.toISOString() ?? null,
			};
		}),

	/**
	 * Check if user has access to a specific premium feature
	 * This can be extended to support different entitlement levels
	 */
	checkAccess: protectedProcedure
		.input(z.object({ feature: z.string().optional() }))
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const user = await db.query.users.findFirst({
				where: eq(users.id, userId),
				columns: {
					isPremium: true,
					subscriptionStatus: true,
					subscriptionExpiresAt: true,
				},
			});

			if (!user) {
				return { hasAccess: false, reason: "user_not_found" };
			}

			// Check if subscription has expired (safety check)
			if (
				user.subscriptionExpiresAt &&
				user.subscriptionExpiresAt < new Date()
			) {
				return { hasAccess: false, reason: "subscription_expired" };
			}

			return {
				hasAccess: user.isPremium,
				reason: user.isPremium ? "active_subscription" : "no_subscription",
			};
		}),
};
