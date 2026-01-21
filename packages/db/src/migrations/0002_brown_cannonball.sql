CREATE TABLE "api_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"provider" text NOT NULL,
	"endpoint" text NOT NULL,
	"call_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_weather_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"saved_route_id" text,
	"polyline" text NOT NULL,
	"segments" jsonb NOT NULL,
	"overall_risk" text NOT NULL,
	"alerts" jsonb DEFAULT '[]'::jsonb,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safe_places_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"radius_km" numeric(5, 2) NOT NULL,
	"places" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weather_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"data" jsonb NOT NULL,
	"source" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_history" ADD COLUMN "weather_snapshots" jsonb;--> statement-breakpoint
ALTER TABLE "trip_history" ADD COLUMN "max_risk_encountered" text;--> statement-breakpoint
ALTER TABLE "trip_history" ADD COLUMN "alerts_encountered" jsonb;--> statement-breakpoint
ALTER TABLE "route_weather_analysis" ADD CONSTRAINT "route_weather_analysis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_weather_analysis" ADD CONSTRAINT "route_weather_analysis_saved_route_id_saved_route_id_fk" FOREIGN KEY ("saved_route_id") REFERENCES "public"."saved_route"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_usage_date_provider_idx" ON "api_usage" USING btree ("date","provider");--> statement-breakpoint
CREATE INDEX "route_weather_analysis_userId_idx" ON "route_weather_analysis" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "route_weather_analysis_analyzedAt_idx" ON "route_weather_analysis" USING btree ("analyzed_at");--> statement-breakpoint
CREATE INDEX "safe_places_cache_coords_idx" ON "safe_places_cache" USING btree ("latitude","longitude","radius_km");--> statement-breakpoint
CREATE INDEX "weather_cache_coords_idx" ON "weather_cache" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "weather_cache_expires_idx" ON "weather_cache" USING btree ("expires_at");