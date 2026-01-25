ALTER TABLE "users" ADD COLUMN "theme" text DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" text DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifications_enabled" boolean DEFAULT true NOT NULL;