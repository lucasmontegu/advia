import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { alertsRouter } from "./alerts";
import { chatRouter } from "./chat";
import { locationsRouter } from "./locations";
import { placesRouter } from "./places";
import { routesRouter } from "./routes";
import { subscriptionRouter } from "./subscription";
import { transcribeRouter } from "./transcribe";
import { userRouter } from "./user";
import { weatherRouter } from "./weather";

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
	transcribe: transcribeRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
