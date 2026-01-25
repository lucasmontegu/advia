import { db } from "@driwet/db";
import { userLocation } from "@driwet/db/schema/user-locations";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const locationsRouter = {
	list: protectedProcedure.handler(async ({ context }) => {
		const locations = await db.query.userLocation.findMany({
			where: eq(userLocation.userId, context.session.user.id),
			orderBy: (locations, { desc }) => [
				desc(locations.isPrimary),
				desc(locations.createdAt),
			],
		});
		return locations;
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				latitude: z.number(),
				longitude: z.number(),
				isPrimary: z.boolean().default(false),
				notifyAlerts: z.boolean().default(true),
			}),
		)
		.handler(async ({ input, context }) => {
			const id = nanoid();

			// If this is primary, unset other primaries
			if (input.isPrimary) {
				await db
					.update(userLocation)
					.set({ isPrimary: false })
					.where(eq(userLocation.userId, context.session.user.id));
			}

			await db.insert(userLocation).values({
				id,
				userId: context.session.user.id,
				name: input.name,
				latitude: input.latitude.toString(),
				longitude: input.longitude.toString(),
				isPrimary: input.isPrimary,
				notifyAlerts: input.notifyAlerts,
			});

			return { id };
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				latitude: z.number().optional(),
				longitude: z.number().optional(),
				notifyAlerts: z.boolean().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;
			await db
				.update(userLocation)
				.set({
					...data,
					latitude: data.latitude?.toString(),
					longitude: data.longitude?.toString(),
				})
				.where(
					and(
						eq(userLocation.id, id),
						eq(userLocation.userId, context.session.user.id),
					),
				);
			return { success: true };
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await db
				.delete(userLocation)
				.where(
					and(
						eq(userLocation.id, input.id),
						eq(userLocation.userId, context.session.user.id),
					),
				);
			return { success: true };
		}),

	setPrimary: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			// Unset all primaries for this user
			await db
				.update(userLocation)
				.set({ isPrimary: false })
				.where(eq(userLocation.userId, context.session.user.id));

			// Set the new primary
			await db
				.update(userLocation)
				.set({ isPrimary: true })
				.where(
					and(
						eq(userLocation.id, input.id),
						eq(userLocation.userId, context.session.user.id),
					),
				);

			return { success: true };
		}),
};
