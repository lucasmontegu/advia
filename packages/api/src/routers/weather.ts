import { z } from "zod";
import { db } from "@driwet/db";
import {
  weatherCache,
  routeWeatherAnalysis,
  alertHistory,
  type WeatherData,
  type AlertType,
} from "@driwet/db/schema/index";
import { eq, and, gt } from "drizzle-orm";
import { protectedProcedure, publicProcedure } from "../index";
import {
  weatherFactory,
  getCacheTTL,
  getGridCoords,
  detectRegion,
  getRegionPricing,
  formatPrice,
  getYearlySavingsPercentage,
  getAllPricingOptions,
  getRegionFromCountryCode,
} from "../lib/weather";

// Helper to generate IDs
function generateId(): string {
  return crypto.randomUUID();
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

      // Fetch from best available provider
      const { current, provider } = await weatherFactory.getTimelines(lat, lng, {
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
          source: provider,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: weatherCache.id,
          set: {
            data: current,
            source: provider,
            fetchedAt: new Date(),
            expiresAt,
          },
        });

      return {
        data: current,
        source: provider,
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

      const { current, hourly, provider } = await weatherFactory.getTimelines(
        lat,
        lng,
        { hours }
      );

      return {
        current,
        hourly,
        provider,
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

      // Fetch alerts using factory (automatically uses provider with alerts support)
      const events = await weatherFactory.getEvents(lat, lng, radiusKm);

      // Map severity from providers to our format
      const severityMap: Record<string, "minor" | "moderate" | "severe" | "extreme"> = {
        minor: "minor",
        moderate: "moderate",
        severe: "severe",
        extreme: "extreme",
      };

      // Map event types to our alert types
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
              source: "tomorrow", // Events currently only from Tomorrow.io
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
        // Use hybrid mode to split across providers
        useHybrid: z.boolean().default(false),
      })
    )
    .handler(async ({ input, context }) => {
      const { polyline, savedRouteId, origin, destination, useHybrid } = input;
      const userId = context.session.user.id;

      // Build points array
      let points: Array<{ lat: number; lng: number; km: number }> = [];

      if (origin && destination) {
        // Simple linear interpolation for demo - in production use actual route
        const numPoints = 10;
        // Calculate approximate distance (haversine simplified)
        const R = 6371; // Earth's radius in km
        const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
        const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((origin.lat * Math.PI) / 180) *
            Math.cos((destination.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const totalDistance = R * c;

        for (let i = 0; i <= numPoints; i++) {
          const ratio = i / numPoints;
          points.push({
            lat: origin.lat + (destination.lat - origin.lat) * ratio,
            lng: origin.lng + (destination.lng - origin.lng) * ratio,
            km: Math.round(ratio * totalDistance),
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

      // Analyze using factory (hybrid or single provider)
      let segments: Array<{ km: number; lat: number; lng: number; weather: WeatherData }>;
      let overallRisk: "low" | "moderate" | "high" | "extreme";
      let usedProviders: string[];

      if (useHybrid) {
        const result = await weatherFactory.analyzeRouteHybrid(points);
        segments = result.segments;
        overallRisk = result.overallRisk;
        usedProviders = result.providers;
      } else {
        const result = await weatherFactory.analyzeRoute(points);
        segments = result.segments;
        overallRisk = result.overallRisk;
        usedProviders = [result.provider];
      }

      // Get alerts along the route
      const alertsPromises = points
        .filter((_, i) => i % 3 === 0) // Sample every 3rd point for alerts
        .map((point) => weatherFactory.getEvents(point.lat, point.lng, 20));
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
        polyline:
          polyline ||
          `${origin?.lat},${origin?.lng}-${destination?.lat},${destination?.lng}`,
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
        providers: usedProviders,
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
      const { current, provider } = await weatherFactory.getTimelines(
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
          const { current: pointWeather } = await weatherFactory.getTimelines(
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
      const alerts = await weatherFactory.getEvents(currentLat, currentLng, 30);

      // Calculate recommended update interval
      const hasHighRisk =
        current.roadRisk === "high" ||
        current.roadRisk === "extreme" ||
        aheadWeather.some(
          (w) =>
            w.weather.roadRisk === "high" || w.weather.roadRisk === "extreme"
        );

      const nextUpdateMs =
        hasHighRisk || alerts.length > 0
          ? 3 * 60 * 1000 // 3 minutes
          : 15 * 60 * 1000; // 15 minutes

      return {
        current,
        ahead: aheadWeather,
        alerts,
        provider,
        nextUpdateMs,
        fetchedAt: new Date(),
      };
    }),

  // Get API usage stats (for monitoring)
  getUsageStats: protectedProcedure.handler(async () => {
    const providersStatus = await weatherFactory.getProvidersStatus();
    const totalRemaining = await weatherFactory.getTotalRemainingCalls();
    const today = new Date().toISOString().split("T")[0];

    return {
      date: today,
      providers: providersStatus,
      totalRemaining,
      totalDailyLimit: providersStatus.reduce((sum, p) => sum + p.dailyLimit, 0),
    };
  }),

  // Get pricing for user's region
  getPricing: publicProcedure
    .input(
      z
        .object({
          lat: z.number().min(-90).max(90).optional(),
          lng: z.number().min(-180).max(180).optional(),
          countryCode: z.string().length(2).optional(),
        })
        .optional()
    )
    .handler(async ({ input }) => {
      let region;

      if (input?.lat !== undefined && input?.lng !== undefined) {
        region = detectRegion({ lat: input.lat, lng: input.lng });
      } else if (input?.countryCode) {
        region = getRegionFromCountryCode(input.countryCode);
      } else {
        // Default to South America (app's primary market)
        region = "south_america" as const;
      }

      const pricing = getRegionPricing(region);
      const yearlySavings = getYearlySavingsPercentage(region);

      return {
        region,
        pricing: {
          monthly: {
            priceInCents: pricing.monthlyPrice,
            formatted: formatPrice(pricing.monthlyPrice, pricing.currency),
          },
          yearly: {
            priceInCents: pricing.yearlyPrice,
            formatted: formatPrice(pricing.yearlyPrice, pricing.currency),
            savingsPercentage: yearlySavings,
          },
        },
        currency: pricing.currency,
        currencySymbol: pricing.currencySymbol,
      };
    }),

  // Get all pricing options (for admin/comparison)
  getAllPricing: publicProcedure.handler(async () => {
    const allPricing = getAllPricingOptions();

    return allPricing.map((pricing) => ({
      region: pricing.region,
      monthly: {
        priceInCents: pricing.monthlyPrice,
        formatted: formatPrice(pricing.monthlyPrice, pricing.currency),
      },
      yearly: {
        priceInCents: pricing.yearlyPrice,
        formatted: formatPrice(pricing.yearlyPrice, pricing.currency),
        savingsPercentage: getYearlySavingsPercentage(pricing.region),
      },
      currency: pricing.currency,
    }));
  }),
};
