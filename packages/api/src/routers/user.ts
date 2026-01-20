import { z } from 'zod';
import { protectedProcedure } from '../index';
import { db } from '@advia/db';
import { user } from '@advia/db/schema/auth';
import { eq } from 'drizzle-orm';

export const userRouter = {
  getProfile: protectedProcedure.handler(async ({ context }) => {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, context.session.user.id),
    });
    return userData;
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        language: z.enum(['en', 'es']).optional(),
        notificationsEnabled: z.boolean().optional(),
      })
    )
    .handler(async () => {
      // TODO: Add settings columns to user table or create separate settings table
      return { success: true };
    }),

  getStats: protectedProcedure.handler(async () => {
    // TODO: Calculate real stats from alert-history and routes
    return {
      stormsAvoided: 12,
      moneySaved: 2400,
      kmTraveled: 847,
    };
  }),
};
