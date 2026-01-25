import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { tomorrowClient } from "../lib/tomorrow-io";

export const alertsRouter = {
	getActive: publicProcedure
		.input(
			z.object({
				latitude: z.number(),
				longitude: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			try {
				// Fetch alerts from Tomorrow.io (works for Argentina/LATAM)
				const events = await tomorrowClient.getEvents(
					input.latitude,
					input.longitude,
					50,
				);

				// Map severity from Tomorrow.io to our format
				const severityMap: Record<
					string,
					"extreme" | "severe" | "moderate" | "minor"
				> = {
					extreme: "extreme",
					severe: "severe",
					moderate: "moderate",
					minor: "minor",
				};

				// Map Tomorrow.io event types to our alert types
				const alertTypeMap: Record<string, string> = {
					fires: "fire",
					wind: "wind",
					winter: "winter_storm",
					floods: "flood",
					air: "air_quality",
					thunderstorm: "thunderstorm",
					tornado: "tornado",
					hail: "hail",
					hurricane: "hurricane",
				};

				const alerts = events.map((event) => {
					const severity = severityMap[event.severity] || "moderate";
					const alertType = alertTypeMap[event.type] || "other";

					return {
						id: event.id,
						type: alertType,
						severity,
						headline: event.title,
						description: event.description,
						expires: event.endTime,
						// Tomorrow.io doesn't provide polygon geometry, so we return null
						// The map component will handle this gracefully
						polygon: null as {
							type: "Polygon";
							coordinates: number[][][];
						} | null,
					};
				});

				return { alerts };
			} catch (error) {
				console.error("Error fetching alerts from Tomorrow.io:", error);
				// Return empty array on error to prevent app crashes
				return { alerts: [] };
			}
		}),

	getHistory: protectedProcedure.handler(async () => {
		// TODO: Implement from alert_history table
		return { alerts: [] };
	}),
};
