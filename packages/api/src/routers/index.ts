import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { userRouter } from './user';
import { locationsRouter } from './locations';
import { alertsRouter } from './alerts';
import { chatRouter } from './chat';
import { routesRouter } from './routes';
import { subscriptionRouter } from './subscription';
import { weatherRouter } from './weather';
import { placesRouter } from './places';

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
  routes: routesRouter,
  subscription: subscriptionRouter,
  weather: weatherRouter,
  places: placesRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
