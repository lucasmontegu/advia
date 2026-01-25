import { expo } from "@better-auth/expo";
import { db } from "@driwet/db";
import * as schema from "@driwet/db/schema/auth";
import { env } from "@driwet/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
	experimental: {
		joins: true,
	},
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
		usePlural: true,
	}),
	trustedOrigins: [env.CORS_ORIGIN, "driwet://", "exp://"],
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 60 * 24, // Refresh session expiry every day when used
	},
	user: {
		additionalFields: {
			theme: {
				type: "string",
				defaultValue: "auto",
				required: false,
			},
			language: {
				type: "string",
				defaultValue: "es",
				required: false,
			},
			notificationsEnabled: {
				type: "boolean",
				defaultValue: true,
				required: false,
			},
			onboardingCompleted: {
				type: "boolean",
				defaultValue: false,
				required: false,
			},
			tripPreferences: {
				type: "string",
				required: false,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		apple: {
			clientId: env.APPLE_CLIENT_ID,
			clientSecret: env.APPLE_CLIENT_SECRET,
		},
	},
	plugins: [
		organization({
			teams: { enabled: true },
		}),
		nextCookies(),
		expo(),
		// Note: Subscriptions are now handled via RevenueCat SDK on the mobile app
	],
});

// Export types for client-side type inference
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
