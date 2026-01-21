import { env } from "@advia/env/server";
import { db } from "@advia/db";
import { apiUsage, type WeatherData, type RoadRisk } from "@advia/db/schema/index";
import { eq, and, sql } from "drizzle-orm";

const TOMORROW_API_BASE = "https://api.tomorrow.io/v4";
const DAILY_LIMIT = 500;

// Tomorrow.io weather codes to precipitation type mapping
const PRECIPITATION_MAP: Record<number, WeatherData["precipitationType"]> = {
  4000: "rain", // Drizzle
  4001: "rain", // Rain
  4200: "rain", // Light Rain
  4201: "rain", // Heavy Rain
  5000: "snow", // Snow
  5001: "snow", // Flurries
  5100: "snow", // Light Snow
  5101: "snow", // Heavy Snow
  6000: "rain", // Freezing Drizzle
  6001: "rain", // Freezing Rain
  6200: "rain", // Light Freezing Rain
  6201: "rain", // Heavy Freezing Rain
  7000: "hail", // Ice Pellets
  7101: "hail", // Heavy Ice Pellets
  7102: "hail", // Light Ice Pellets
};

// Calculate road risk based on weather conditions
export function calculateRoadRisk(data: {
  precipitationIntensity: number;
  windSpeed: number;
  windGust: number;
  visibility: number;
  weatherCode: number;
}): RoadRisk {
  const { precipitationIntensity, windSpeed, windGust, visibility, weatherCode } = data;

  // Extreme conditions
  if (
    windGust > 80 ||
    visibility < 0.5 ||
    [8000].includes(weatherCode) // Thunderstorm
  ) {
    return "extreme";
  }

  // High risk conditions
  if (
    precipitationIntensity > 10 ||
    windSpeed > 60 ||
    windGust > 60 ||
    visibility < 1 ||
    [7000, 7101, 7102].includes(weatherCode) // Hail
  ) {
    return "high";
  }

  // Moderate risk
  if (
    precipitationIntensity > 2 ||
    windSpeed > 40 ||
    visibility < 3 ||
    [5000, 5001, 5100, 5101].includes(weatherCode) // Snow
  ) {
    return "moderate";
  }

  return "low";
}

// Parse Tomorrow.io response to WeatherData
export function parseWeatherResponse(values: Record<string, number | undefined>): WeatherData {
  const weatherCode = values.weatherCode ?? 1000;
  const precipIntensity = values.precipitationIntensity ?? 0;
  const precipitationType =
    PRECIPITATION_MAP[weatherCode] ||
    (precipIntensity > 0 ? "rain" : "none");

  const weatherData: WeatherData = {
    temperature: values.temperature ?? 0,
    humidity: values.humidity ?? 0,
    windSpeed: values.windSpeed ?? 0,
    windGust: values.windGust ?? 0,
    visibility: values.visibility ?? 10,
    precipitationIntensity: values.precipitationIntensity ?? 0,
    precipitationType,
    weatherCode: values.weatherCode ?? 1000,
    uvIndex: values.uvIndex ?? 0,
    cloudCover: values.cloudCover ?? 0,
    roadRisk: "low", // Will be calculated below
  };

  weatherData.roadRisk = calculateRoadRisk(weatherData);
  return weatherData;
}

// Cache key generation using grid-based coordinates (~1km precision)
export function getCacheKey(lat: number, lng: number): string {
  const gridLat = Math.round(lat * 100) / 100;
  const gridLng = Math.round(lng * 100) / 100;
  return `${gridLat}:${gridLng}`;
}

// Dynamic TTL based on weather risk
export function getCacheTTL(risk: RoadRisk): number {
  switch (risk) {
    case "extreme":
      return 2 * 60 * 1000; // 2 minutes
    case "high":
      return 5 * 60 * 1000; // 5 minutes
    case "moderate":
      return 10 * 60 * 1000; // 10 minutes
    default:
      return 15 * 60 * 1000; // 15 minutes
  }
}

// Track API usage
async function trackApiUsage(endpoint: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0]!;
  const id = `tomorrow:${today}:${endpoint}`;

  try {
    await db
      .insert(apiUsage)
      .values({
        id,
        date: today,
        provider: "tomorrow",
        endpoint,
        callCount: 1,
      })
      .onConflictDoUpdate({
        target: apiUsage.id,
        set: {
          callCount: sql`${apiUsage.callCount} + 1`,
        },
      });
  } catch (error) {
    console.error("Failed to track API usage:", error);
  }
}

// Check if we're approaching the daily limit
export async function checkApiLimit(): Promise<{
  remaining: number;
  exceeded: boolean;
}> {
  const today = new Date().toISOString().split("T")[0]!;

  const usage = await db
    .select({
      total: sql<number>`COALESCE(SUM(${apiUsage.callCount}), 0)`,
    })
    .from(apiUsage)
    .where(and(eq(apiUsage.date, today), eq(apiUsage.provider, "tomorrow")));

  const used = Number(usage[0]?.total ?? 0);
  return {
    remaining: DAILY_LIMIT - used,
    exceeded: used >= DAILY_LIMIT,
  };
}

// Tomorrow.io API client
export const tomorrowClient = {
  // Get current weather + short forecast for a location
  async getTimelines(
    lat: number,
    lng: number,
    options: { hours?: number } = {}
  ): Promise<{
    current: WeatherData;
    hourly: Array<{ time: string; weather: WeatherData }>;
  }> {
    const { exceeded } = await checkApiLimit();
    if (exceeded) {
      throw new Error("Tomorrow.io daily API limit exceeded");
    }

    const hours = options.hours ?? 12;
    const fields = [
      "temperature",
      "humidity",
      "windSpeed",
      "windGust",
      "visibility",
      "precipitationIntensity",
      "weatherCode",
      "uvIndex",
      "cloudCover",
    ];

    const response = await fetch(`${TOMORROW_API_BASE}/timelines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.TOMORROW_IO_API_KEY,
      },
      body: JSON.stringify({
        location: [lat, lng],
        fields,
        timesteps: ["current", "1h"],
        endTime: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        units: "metric",
      }),
    });

    await trackApiUsage("timelines");

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tomorrow.io API error: ${error}`);
    }

    const data = (await response.json()) as { data?: { timelines?: unknown[] } };
    const timelines = (data.data?.timelines || []) as Array<{
      timestep: string;
      intervals?: Array<{ startTime: string; values: Record<string, number | undefined> }>;
    }>;

    // Parse current weather
    const currentTimeline = timelines.find((t) => t.timestep === "current");
    const currentValues = currentTimeline?.intervals?.[0]?.values || {};
    const current = parseWeatherResponse(currentValues);

    // Parse hourly forecast
    const hourlyTimeline = timelines.find((t) => t.timestep === "1h");
    const hourly = (hourlyTimeline?.intervals || []).map((interval) => ({
      time: interval.startTime,
      weather: parseWeatherResponse(interval.values),
    }));

    return { current, hourly };
  },

  // Get weather events/alerts for an area
  async getEvents(
    lat: number,
    lng: number,
    _radiusKm: number = 50 // Reserved for future use with polygon filtering
  ): Promise<
    Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      startTime: string;
      endTime: string;
    }>
  > {
    const { exceeded } = await checkApiLimit();
    if (exceeded) {
      throw new Error("Tomorrow.io daily API limit exceeded");
    }

    // Tomorrow.io events endpoint uses insights
    const response = await fetch(
      `${TOMORROW_API_BASE}/events?location=${lat},${lng}&insights=fires,wind,winter,floods,air`,
      {
        headers: {
          apikey: env.TOMORROW_IO_API_KEY,
        },
      }
    );

    await trackApiUsage("events");

    if (!response.ok) {
      // Events endpoint might not be available in free tier, return empty
      if (response.status === 403) {
        return [];
      }
      const error = await response.text();
      throw new Error(`Tomorrow.io events API error: ${error}`);
    }

    interface TomorrowEvent {
      eventId: string;
      insight: string;
      severity: string;
      headline: string;
      description: string;
      startTime: string;
      endTime: string;
    }

    const data = (await response.json()) as { data?: { events?: TomorrowEvent[] } };
    const events = data.data?.events || [];

    return events.map((event) => ({
        id: event.eventId,
        type: event.insight,
        severity: event.severity || "moderate",
        title: event.headline,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
      })
    );
  },

  // Analyze weather along a route (using multiple point samples)
  async analyzeRoute(
    points: Array<{ lat: number; lng: number; km: number }>
  ): Promise<{
    segments: Array<{ km: number; lat: number; lng: number; weather: WeatherData }>;
    overallRisk: RoadRisk;
  }> {
    const { exceeded, remaining } = await checkApiLimit();
    if (exceeded) {
      throw new Error("Tomorrow.io daily API limit exceeded");
    }

    // Limit points to avoid excessive API usage
    const maxPoints = Math.min(points.length, remaining, 10);
    const step = Math.ceil(points.length / maxPoints);
    const sampledPoints = points.filter((_, i) => i % step === 0);

    const segments: Array<{
      km: number;
      lat: number;
      lng: number;
      weather: WeatherData;
    }> = [];

    // Fetch weather for each sampled point
    for (const point of sampledPoints) {
      try {
        const { current } = await this.getTimelines(point.lat, point.lng, {
          hours: 1,
        });
        segments.push({
          km: point.km,
          lat: point.lat,
          lng: point.lng,
          weather: current,
        });
      } catch (error) {
        console.error(`Failed to get weather for point ${point.km}km:`, error);
      }
    }

    // Calculate overall risk (highest risk encountered)
    const riskPriority: Record<RoadRisk, number> = {
      low: 0,
      moderate: 1,
      high: 2,
      extreme: 3,
    };

    const overallRisk = segments.reduce<RoadRisk>((highest, segment) => {
      return riskPriority[segment.weather.roadRisk] > riskPriority[highest]
        ? segment.weather.roadRisk
        : highest;
    }, "low");

    return { segments, overallRisk };
  },
};
