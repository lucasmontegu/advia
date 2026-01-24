import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    // Note: Subscriptions are now handled via RevenueCat SDK on mobile apps
    CORS_ORIGIN: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Social auth providers
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    APPLE_CLIENT_ID: z.string().min(1),
    APPLE_CLIENT_SECRET: z.string().min(1),
    // Email
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1).default("Driwet <delivered@resend.dev>"),
    // Weather API
    TOMORROW_IO_API_KEY: z.string().min(1),
    // Mapbox (for server-side POI search)
    MAPBOX_ACCESS_TOKEN: z.string().startsWith("pk.").optional(),
    OPEN_WEATHER_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
