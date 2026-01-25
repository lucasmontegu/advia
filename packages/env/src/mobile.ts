import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "EXPO_PUBLIC_",
	client: {
		EXPO_PUBLIC_SERVER_URL: z.string().url(),
		EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().startsWith("pk."),
		EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
		EXPO_PUBLIC_POSTHOG_HOST: z.string().optional(),
		EXPO_PUBLIC_REVENUECAT_API_KEY: z.string().min(1),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
