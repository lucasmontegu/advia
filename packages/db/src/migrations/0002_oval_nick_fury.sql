ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trip_preferences" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_product_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revenuecat_customer_id" text;