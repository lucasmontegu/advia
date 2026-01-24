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
} from "./utils";

const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";
const OPENWEATHER_API_3 = "https://api.openweathermap.org/data/3.0";

// OpenWeather free tier: 1000 calls/day
const DAILY_LIMIT = 1000;

// OpenWeather weather condition codes to our codes mapping
function normalizeWeatherCode(owmCode: number): number {
  // OpenWeather uses 2xx-8xx codes, we keep them as-is for our precipitation mapping
  return owmCode;
}

// Parse OpenWeather response to our WeatherData format
function parseOpenWeatherResponse(data: OpenWeatherCurrent): WeatherData {
  const weatherCode = data.weather?.[0]?.id ?? 800;
  const precipIntensity = (data.rain?.["1h"] ?? data.snow?.["1h"] ?? 0);

  const weatherData: WeatherData = {
    temperature: data.main?.temp ?? 0,
    humidity: data.main?.humidity ?? 0,
    windSpeed: (data.wind?.speed ?? 0) * 3.6, // m/s to km/h
    windGust: (data.wind?.gust ?? data.wind?.speed ?? 0) * 3.6,
    visibility: (data.visibility ?? 10000) / 1000, // m to km
    precipitationIntensity: precipIntensity,
    precipitationType: getPrecipitationType(weatherCode, precipIntensity),
    weatherCode: normalizeWeatherCode(weatherCode),
    uvIndex: data.uvi ?? 0,
    cloudCover: data.clouds?.all ?? 0,
    roadRisk: "low",
  };

  weatherData.roadRisk = calculateRoadRisk(weatherData);
  return weatherData;
}

// Parse forecast item to WeatherData
function parseForecastItem(item: OpenWeatherForecastItem): WeatherData {
  const weatherCode = item.weather?.[0]?.id ?? 800;
  const precipIntensity = (item.rain?.["3h"] ?? item.snow?.["3h"] ?? 0) / 3; // Per hour

  const weatherData: WeatherData = {
    temperature: item.main?.temp ?? 0,
    humidity: item.main?.humidity ?? 0,
    windSpeed: (item.wind?.speed ?? 0) * 3.6,
    windGust: (item.wind?.gust ?? item.wind?.speed ?? 0) * 3.6,
    visibility: (item.visibility ?? 10000) / 1000,
    precipitationIntensity: precipIntensity,
    precipitationType: getPrecipitationType(weatherCode, precipIntensity),
    weatherCode: normalizeWeatherCode(weatherCode),
    uvIndex: 0, // Not available in forecast
    cloudCover: item.clouds?.all ?? 0,
    roadRisk: "low",
  };

  weatherData.roadRisk = calculateRoadRisk(weatherData);
  return weatherData;
}

// Types for OpenWeather API responses
interface OpenWeatherCurrent {
  main?: {
    temp?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
    gust?: number;
  };
  visibility?: number;
  rain?: { "1h"?: number };
  snow?: { "1h"?: number };
  clouds?: { all?: number };
  weather?: Array<{ id?: number }>;
  uvi?: number;
}

interface OpenWeatherForecastItem {
  dt: number;
  main?: {
    temp?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
    gust?: number;
  };
  visibility?: number;
  rain?: { "3h"?: number };
  snow?: { "3h"?: number };
  clouds?: { all?: number };
  weather?: Array<{ id?: number }>;
  dt_txt?: string;
}

interface OpenWeatherForecastResponse {
  list?: OpenWeatherForecastItem[];
}

// OpenWeather provider implementation
class OpenWeatherProvider implements IWeatherProvider {
  readonly name = "openweather" as const;
  readonly config: ProviderConfig = {
    name: "openweather",
    dailyLimit: DAILY_LIMIT,
    priority: 2, // Secondary priority (Tomorrow.io is primary)
    supportedFeatures: {
      current: true,
      forecast: true,
      alerts: false, // Alerts require paid tier
      historical: false,
    },
  };

  async isAvailable(): Promise<boolean> {
    const { exceeded } = await checkApiLimit("openweather", DAILY_LIMIT);
    return !exceeded;
  }

  async getRemainingCalls(): Promise<number> {
    const { remaining } = await checkApiLimit("openweather", DAILY_LIMIT);
    return remaining;
  }

  async getTimelines(
    lat: number,
    lng: number,
    options: { hours?: number } = {}
  ): Promise<WeatherTimelinesResponse> {
    const { exceeded } = await checkApiLimit("openweather", DAILY_LIMIT);
    if (exceeded) {
      throw new Error("OpenWeather daily API limit exceeded");
    }

    const hours = options.hours ?? 12;

    // Fetch current weather and forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `${OPENWEATHER_API_BASE}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${env.OPEN_WEATHER_API_KEY}`
      ),
      fetch(
        `${OPENWEATHER_API_BASE}/forecast?lat=${lat}&lon=${lng}&units=metric&cnt=${Math.ceil(hours / 3)}&appid=${env.OPEN_WEATHER_API_KEY}`
      ),
    ]);

    // Track both API calls
    await Promise.all([
      trackApiUsage("openweather", "weather"),
      trackApiUsage("openweather", "forecast"),
    ]);

    if (!currentResponse.ok) {
      const error = await currentResponse.text();
      throw new Error(`OpenWeather API error: ${error}`);
    }

    if (!forecastResponse.ok) {
      const error = await forecastResponse.text();
      throw new Error(`OpenWeather Forecast API error: ${error}`);
    }

    const currentData = (await currentResponse.json()) as OpenWeatherCurrent;
    const forecastData = (await forecastResponse.json()) as OpenWeatherForecastResponse;

    const current = parseOpenWeatherResponse(currentData);

    // Parse hourly forecast (OpenWeather free tier gives 3h intervals)
    const hourly = (forecastData.list ?? []).map((item) => ({
      time: item.dt_txt ?? new Date(item.dt * 1000).toISOString(),
      weather: parseForecastItem(item),
    }));

    return { current, hourly };
  }

  async getEvents(
    _lat: number,
    _lng: number,
    _radiusKm?: number
  ): Promise<WeatherEvent[]> {
    // OpenWeather alerts require paid tier (One Call API 3.0)
    // Return empty array for free tier
    console.warn("OpenWeather alerts require paid tier - returning empty");
    return [];
  }

  async analyzeRoute(
    points: Array<{ lat: number; lng: number; km: number }>
  ): Promise<RouteAnalysisResponse> {
    const { exceeded, remaining } = await checkApiLimit("openweather", DAILY_LIMIT);
    if (exceeded || remaining < 2) {
      throw new Error("OpenWeather daily API limit exceeded");
    }

    // Limit points to avoid excessive API usage (2 calls per point: current + forecast)
    const maxPoints = Math.min(points.length, Math.floor(remaining / 2), 10);
    if (maxPoints <= 0) {
      throw new Error("OpenWeather API limit too low for route analysis");
    }
    const step = Math.max(1, Math.ceil(points.length / maxPoints));
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
        console.error(`OpenWeather: Failed to get weather for point ${point.km}km:`, error);
      }
    }

    const overallRisk = calculateOverallRisk(segments);
    return { segments, overallRisk };
  }
}

// Export singleton instance
export const openWeatherProvider = new OpenWeatherProvider();

// Export for testing
export { OpenWeatherProvider, parseOpenWeatherResponse, parseForecastItem };
