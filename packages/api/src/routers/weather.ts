import { z } from "zod";
import { db } from "@advia/db";
import {
  weatherCache,
  routeWeatherAnalysis,
  alertHistory,
  type WeatherData,
  type AlertType,
} from "@advia/db/schema/index";
import { eq, and, gt } from "drizzle-orm";
import { protectedProcedure } from "../index";
import {
  tomorrowClient,
  getCacheTTL,
  checkApiLimit,
} from "../lib/tomorrow-io";

// Helper to generate IDs
function generateId(): string {
  return crypto.randomUUID();
}

// Get grid coordinates for cache lookup
function getGridCoords(lat: number, lng: number) {
  return {
    gridLat: (Math.round(lat * 100) / 100).toString(),
    gridLng: (Math.round(lng * 100) / 100).toString(),
  };
}

export const weatherRouter = {
  // Get current weather for a location (with caching)
  getCurrent: protectedProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
    )
    .handler(async ({ input }) => {
      const { lat, lng } = input;
      const { gridLat, gridLng } = getGridCoords(lat, lng);
      const cacheId = `weather:${gridLat}:${gridLng}`;

      // Check cache first
      const cached = await db
        .select()
        .from(weatherCache)
        .where(
          and(
            eq(weatherCache.id, cacheId),
            gt(weatherCache.expiresAt, new Date())
          )
        )
        .limit(1);

      if (cached.length > 0 && cached[0]) {
        return {
          data: cached[0].data,
          source: cached[0].source,
          cached: true,
          fetchedAt: cached[0].fetchedAt,
        };
      }

      // Fetch from Tomorrow.io
      const { current } = await tomorrowClient.getTimelines(lat, lng, {
        hours: 1,
      });

      // Cache the result
      const ttl = getCacheTTL(current.roadRisk);
      const expiresAt = new Date(Date.now() + ttl);

      await db
        .insert(weatherCache)
        .values({
          id: cacheId,
          latitude: gridLat,
          longitude: gridLng,
          data: current,
          source: "tomorrow",
          expiresAt,
        })
        .onConflictDoUpdate({
          target: weatherCache.id,
          set: {
            data: current,
            fetchedAt: new Date(),
            expiresAt,
          },
        });

      return {
        data: current,
        source: "tomorrow" as const,
        cached: false,
        fetchedAt: new Date(),
      };
    }),

  // Get hourly forecast for a location
  getForecast: protectedProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        hours: z.number().min(1).max(24).default(12),
      })
    )
    .handler(async ({ input }) => {
      const { lat, lng, hours } = input;

      const { current, hourly } = await tomorrowClient.getTimelines(lat, lng, {
        hours,
      });

      return {
        current,
        hourly,
        fetchedAt: new Date(),
      };
    }),

  // Get active weather alerts in an area
  getAlerts: protectedProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(200).default(50),
      })
    )
    .handler(async ({ input, context }) => {
      const { lat, lng, radiusKm } = input;
      const userId = context.session.user.id;

      // Fetch alerts from Tomorrow.io
      const events = await tomorrowClient.getEvents(lat, lng, radiusKm);

      // Map severity from Tomorrow.io to our format
      const severityMap: Record<string, "minor" | "moderate" | "severe" | "extreme"> = {
        minor: "minor",
        moderate: "moderate",
        severe: "severe",
        extreme: "extreme",
      };

      // Map Tomorrow.io event types to our alert types
      const alertTypeMap: Record<string, AlertType> = {
        fires: "other",
        wind: "extreme_wind",
        winter: "winter_storm",
        floods: "flood",
        air: "other",
        thunderstorm: "thunderstorm",
        tornado: "tornado",
        hail: "hail",
        hurricane: "hurricane",
      };

      // Save alerts to history and return
      const alerts = await Promise.all(
        events.map(async (event) => {
          const alertId = generateId();
          const severity = severityMap[event.severity] || "moderate";
          const alertType = alertTypeMap[event.type] || "other";

          // Store in alert_history
          await db
            .insert(alertHistory)
            .values({
              id: alertId,
              userId,
              externalId: event.id,
              alertType,
              severity,
              title: event.title,
              description: event.description,
              source: "tomorrow",
              latitude: lat.toString(),
              longitude: lng.toString(),
              startsAt: event.startTime ? new Date(event.startTime) : null,
              expiresAt: event.endTime ? new Date(event.endTime) : null,
            })
            .onConflictDoNothing();

          return {
            id: alertId,
            externalId: event.id,
            type: event.type,
            severity,
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
          };
        })
      );

      return {
        alerts,
        count: alerts.length,
        fetchedAt: new Date(),
      };
    }),

  // Analyze weather along a route
  analyzeRoute: protectedProcedure
    .input(
      z.object({
        polyline: z.string(),
        savedRouteId: z.string().optional(),
        // Alternative: provide origin/destination and we'll get the polyline
        origin: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
        destination: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { polyline, savedRouteId, origin, destination } = input;
      const userId = context.session.user.id;

      // Decode polyline to points (simplified - you may want to use @mapbox/polyline)
      // For now, if origin/destination provided, sample points along the line
      let points: Array<{ lat: number; lng: number; km: number }> = [];

      if (origin && destination) {
        // Simple linear interpolation for demo - in production use actual route
        const numPoints = 10;
        for (let i = 0; i <= numPoints; i++) {
          const ratio = i / numPoints;
          points.push({
            lat: origin.lat + (destination.lat - origin.lat) * ratio,
            lng: origin.lng + (destination.lng - origin.lng) * ratio,
            km: Math.round(ratio * 100), // Approximate
          });
        }
      } else if (polyline) {
        // Decode polyline - for now just use start/end
        // In production, use @mapbox/polyline to decode
        points = [
          { lat: -34.6037, lng: -58.3816, km: 0 }, // Buenos Aires (placeholder)
          { lat: -31.4201, lng: -64.1888, km: 700 }, // Córdoba (placeholder)
        ];
      }

      // Analyze weather along route
      const { segments, overallRisk } = await tomorrowClient.analyzeRoute(points);

      // Get alerts along the route
      const alertsPromises = points.map((point) =>
        tomorrowClient.getEvents(point.lat, point.lng, 20)
      );
      const alertsResults = await Promise.all(alertsPromises);
      const uniqueAlerts = new Map();
      alertsResults.flat().forEach((alert) => {
        if (!uniqueAlerts.has(alert.id)) {
          uniqueAlerts.set(alert.id, alert);
        }
      });

      // Store analysis
      const analysisId = generateId();
      const validUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(routeWeatherAnalysis).values({
        id: analysisId,
        userId,
        savedRouteId: savedRouteId || null,
        polyline: polyline || `${origin?.lat},${origin?.lng}-${destination?.lat},${destination?.lng}`,
        segments,
        overallRisk,
        alerts: Array.from(uniqueAlerts.values()),
        validUntil,
      });

      return {
        id: analysisId,
        segments,
        overallRisk,
        alerts: Array.from(uniqueAlerts.values()),
        validUntil,
        analyzedAt: new Date(),
      };
    }),

  // Get route updates during a trip (for monitoring)
  getRouteUpdates: protectedProcedure
    .input(
      z.object({
        currentLat: z.number().min(-90).max(90),
        currentLng: z.number().min(-180).max(180),
        destinationLat: z.number().min(-90).max(90),
        destinationLng: z.number().min(-180).max(180),
        hasActiveAlerts: z.boolean().default(false),
      })
    )
    .handler(async ({ input }) => {
      const { currentLat, currentLng, destinationLat, destinationLng } = input;

      // Get current weather at driver's location
      const { current } = await tomorrowClient.getTimelines(
        currentLat,
        currentLng,
        { hours: 3 }
      );

      // Sample points ahead on the route
      const aheadPoints = [
        { lat: currentLat, lng: currentLng, km: 0 },
        {
          lat: currentLat + (destinationLat - currentLat) * 0.25,
          lng: currentLng + (destinationLng - currentLng) * 0.25,
          km: 25,
        },
        {
          lat: currentLat + (destinationLat - currentLat) * 0.5,
          lng: currentLng + (destinationLng - currentLng) * 0.5,
          km: 50,
        },
      ];

      // Get weather ahead (limited calls)
      const aheadWeather: Array<{ km: number; weather: WeatherData }> = [];
      for (const point of aheadPoints.slice(1)) {
        try {
          const { current: pointWeather } = await tomorrowClient.getTimelines(
            point.lat,
            point.lng,
            { hours: 1 }
          );
          aheadWeather.push({ km: point.km, weather: pointWeather });
        } catch {
          // Skip on error
        }
      }

      // Get alerts in the area
      const alerts = await tomorrowClient.getEvents(currentLat, currentLng, 30);

      // Calculate recommended update interval
      const hasHighRisk =
        current.roadRisk === "high" ||
        current.roadRisk === "extreme" ||
        aheadWeather.some(
          (w) => w.weather.roadRisk === "high" || w.weather.roadRisk === "extreme"
        );

      const nextUpdateMs = hasHighRisk || alerts.length > 0
        ? 3 * 60 * 1000 // 3 minutes
        : 15 * 60 * 1000; // 15 minutes

      return {
        current,
        ahead: aheadWeather,
        alerts,
        nextUpdateMs,
        fetchedAt: new Date(),
      };
    }),

  // Get API usage stats (for monitoring)
  getUsageStats: protectedProcedure.handler(async () => {
    const { remaining, exceeded } = await checkApiLimit();
    const today = new Date().toISOString().split("T")[0];

    return {
      date: today,
      remaining,
      exceeded,
      dailyLimit: 500,
    };
  }),
};
