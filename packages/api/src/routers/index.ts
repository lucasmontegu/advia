import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { userRouter } from './user';
import { locationsRouter } from './locations';
import { alertsRouter } from './alerts';
import { chatRouter } from './chat';

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  user: userRouter,
  locations: locationsRouter,
  alerts: alertsRouter,
  chat: chatRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
