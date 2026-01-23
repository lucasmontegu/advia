import { env } from "@driwet/env/server";
import type {
  IWeatherProvider,
  ProviderConfig,
  WeatherTimelinesResponse,
  WeatherEvent,
  RouteAnalysisResponse,
  WeatherData,
} from "./types";
import {
  calculateRoadRisk,
  getPrecipitationType,
  trackApiUsage,
  checkApiLimit,
  calculateOverallRisk,
  PRECIPITATION_MAP,
} from "./utils";

const TOMORROW_API_BASE = "https://api.tomorrow.io/v4";

// Tomorrow.io free tier: 500 calls/day
const DAILY_LIMIT = 500;

// Parse Tomorrow.io response to WeatherData
function parseTomorrowResponse(values: Record<string, number | undefined>): WeatherData {
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
    precipitationIntensity: precipIntensity,
    precipitationType,
    weatherCode: values.weatherCode ?? 1000,
    uvIndex: values.uvIndex ?? 0,
    cloudCover: values.cloudCover ?? 0,
    roadRisk: "low",
  };

  weatherData.roadRisk = calculateRoadRisk(weatherData);
  return weatherData;
}

// Tomorrow.io provider implementation
class TomorrowIoProvider implements IWeatherProvider {
  readonly name = "tomorrow" as const;
  readonly config: ProviderConfig = {
    name: "tomorrow",
    dailyLimit: DAILY_LIMIT,
    priority: 1, // Primary provider
    supportedFeatures: {
      current: true,
      forecast: true,
      alerts: true, // Has events endpoint
      historical: false,
    },
  };

  async isAvailable(): Promise<boolean> {
    const { exceeded } = await checkApiLimit("tomorrow", DAILY_LIMIT);
    return !exceeded;
  }

  async getRemainingCalls(): Promise<number> {
    const { remaining } = await checkApiLimit("tomorrow", DAILY_LIMIT);
    return remaining;
  }

  async getTimelines(
    lat: number,
    lng: number,
    options: { hours?: number } = {}
  ): Promise<WeatherTimelinesResponse> {
    const { exceeded } = await checkApiLimit("tomorrow", DAILY_LIMIT);
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

    await trackApiUsage("tomorrow", "timelines");

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
    const current = parseTomorrowResponse(currentValues);

    // Parse hourly forecast
    const hourlyTimeline = timelines.find((t) => t.timestep === "1h");
    const hourly = (hourlyTimeline?.intervals || []).map((interval) => ({
      time: interval.startTime,
      weather: parseTomorrowResponse(interval.values),
    }));

    return { current, hourly };
  }

  async getEvents(
    lat: number,
    lng: number,
    _radiusKm: number = 50
  ): Promise<WeatherEvent[]> {
    const { exceeded } = await checkApiLimit("tomorrow", DAILY_LIMIT);
    if (exceeded) {
      throw new Error("Tomorrow.io daily API limit exceeded");
    }

    const response = await fetch(
      `${TOMORROW_API_BASE}/events?location=${lat},${lng}&insights=fires,wind,winter,floods,air`,
      {
        headers: {
          apikey: env.TOMORROW_IO_API_KEY,
        },
      }
    );

    await trackApiUsage("tomorrow", "events");

    if (!response.ok) {
      // Events endpoint might not be available in free tier
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
    }));
  }

  async analyzeRoute(
    points: Array<{ lat: number; lng: number; km: number }>
  ): Promise<RouteAnalysisResponse> {
    const { exceeded, remaining } = await checkApiLimit("tomorrow", DAILY_LIMIT);
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
        console.error(`Tomorrow.io: Failed to get weather for point ${point.km}km:`, error);
      }
    }

    const overallRisk = calculateOverallRisk(segments);
    return { segments, overallRisk };
  }
}

// Export singleton instance
export const tomorrowIoProvider = new TomorrowIoProvider();

// Export for testing and backwards compatibility
export { TomorrowIoProvider, parseTomorrowResponse };

// Legacy exports for backwards compatibility
export { calculateRoadRisk, getCacheTTL, checkApiLimit as checkTomorrowApiLimit } from "./utils";
export const tomorrowClient = {
  getTimelines: (lat: number, lng: number, options?: { hours?: number }) =>
    tomorrowIoProvider.getTimelines(lat, lng, options),
  getEvents: (lat: number, lng: number, radiusKm?: number) =>
    tomorrowIoProvider.getEvents(lat, lng, radiusKm),
  analyzeRoute: (points: Array<{ lat: number; lng: number; km: number }>) =>
    tomorrowIoProvider.analyzeRoute(points),
};
