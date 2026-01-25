import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().url(),
		CORS_ORIGIN: z.string().url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		// Social auth providers
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		APPLE_CLIENT_ID: z.string().min(1),
		APPLE_CLIENT_SECRET: z.string().min(1),
		RESEND_API_KEY: z.string().min(1),
		OPEN_WEATHER_API_KEY: z.string().min(1),
	},
	client: {},
	runtimeEnv: {
		GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		DATABASE_URL: process.env.DATABASE_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		CORS_ORIGIN: process.env.CORS_ORIGIN,
		NODE_ENV: process.env.NODE_ENV,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
		APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY,
	},
	emptyStringAsUndefined: true,
});
