CREATE TABLE "saved_route" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"origin_name" text NOT NULL,
	"origin_latitude" numeric(10, 7) NOT NULL,
	"origin_longitude" numeric(10, 7) NOT NULL,
	"destination_name" text NOT NULL,
	"destination_latitude" numeric(10, 7) NOT NULL,
	"destination_longitude" numeric(10, 7) NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"saved_route_id" text,
	"origin_name" text NOT NULL,
	"origin_latitude" numeric(10, 7) NOT NULL,
	"origin_longitude" numeric(10, 7) NOT NULL,
	"destination_name" text NOT NULL,
	"destination_latitude" numeric(10, 7) NOT NULL,
	"destination_longitude" numeric(10, 7) NOT NULL,
	"distance_km" numeric(8, 2),
	"duration_minutes" integer,
	"weather_condition" text,
	"outcome" text DEFAULT 'completed' NOT NULL,
	"alerts_avoided_count" integer DEFAULT 0 NOT NULL,
	"estimated_savings" numeric(10, 2) DEFAULT '0',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_route" ADD CONSTRAINT "saved_route_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_history" ADD CONSTRAINT "trip_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_history" ADD CONSTRAINT "trip_history_saved_route_id_saved_route_id_fk" FOREIGN KEY ("saved_route_id") REFERENCES "public"."saved_route"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_route_userId_idx" ON "saved_route" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_history_userId_idx" ON "trip_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_history_savedRouteId_idx" ON "trip_history" USING btree ("saved_route_id");--> statement-breakpoint
CREATE INDEX "trip_history_startedAt_idx" ON "trip_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "trip_history_outcome_idx" ON "trip_history" USING btree ("outcome");