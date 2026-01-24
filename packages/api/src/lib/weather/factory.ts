import type {
  IWeatherProvider,
  WeatherTimelinesResponse,
  WeatherEvent,
  RouteAnalysisResponse,
  WeatherFactoryOptions,
  ProviderStrategy,
  ApiProvider,
} from "./types";
import { tomorrowIoProvider } from "./tomorrow-io";
import { openWeatherProvider } from "./openweather";

// All available providers
const providers: Map<ApiProvider, IWeatherProvider> = new Map([
  ["tomorrow", tomorrowIoProvider],
  ["openweather", openWeatherProvider],
]);

// Provider priority for different strategies
const STRATEGY_PRIORITIES: Record<ProviderStrategy, ApiProvider[]> = {
  // Cost optimized: Use Tomorrow.io first (has alerts), fallback to OpenWeather
  cost_optimized: ["tomorrow", "openweather"],
  // Performance: Tomorrow.io has better hourly data
  performance: ["tomorrow", "openweather"],
  // Reliability: Balance load across providers
  reliability: ["openweather", "tomorrow"],
};

// Get sorted providers by availability and strategy
async function getSortedProviders(
  strategy: ProviderStrategy = "cost_optimized",
  preferredProvider?: ApiProvider
): Promise<IWeatherProvider[]> {
  const priorityOrder = STRATEGY_PRIORITIES[strategy];
  const sortedProviders: IWeatherProvider[] = [];

  // If preferred provider specified, try it first
  if (preferredProvider && providers.has(preferredProvider)) {
    const preferred = providers.get(preferredProvider)!;
    if (await preferred.isAvailable()) {
      sortedProviders.push(preferred);
    }
  }

  // Add remaining providers in priority order
  for (const providerName of priorityOrder) {
    if (providerName === preferredProvider) continue; // Already added

    const provider = providers.get(providerName);
    if (provider && (await provider.isAvailable())) {
      sortedProviders.push(provider);
    }
  }

  return sortedProviders;
}

// Get the best available provider based on strategy and remaining calls
async function getBestProvider(
  options: WeatherFactoryOptions = {}
): Promise<IWeatherProvider> {
  const { strategy = "cost_optimized", preferredProvider } = options;
  const availableProviders = await getSortedProviders(strategy, preferredProvider);

  if (availableProviders.length === 0) {
    throw new Error("No weather providers available. Daily limits may be exceeded.");
  }

  return availableProviders[0]!;
}

// Smart provider selection based on remaining calls
async function getProviderForBulkOperation(
  requiredCalls: number,
  options: WeatherFactoryOptions = {}
): Promise<IWeatherProvider> {
  const { strategy = "cost_optimized", preferredProvider } = options;
  const availableProviders = await getSortedProviders(strategy, preferredProvider);

  for (const provider of availableProviders) {
    const remaining = await provider.getRemainingCalls();
    if (remaining >= requiredCalls) {
      return provider;
    }
  }

  // Return the one with most remaining calls
  let bestProvider: IWeatherProvider | null = null;
  let maxRemaining = 0;

  for (const provider of availableProviders) {
    const remaining = await provider.getRemainingCalls();
    if (remaining > maxRemaining) {
      maxRemaining = remaining;
      bestProvider = provider;
    }
  }

  if (!bestProvider) {
    throw new Error("No weather providers available with sufficient API calls remaining.");
  }

  return bestProvider;
}

// Weather factory with fallback logic
export const weatherFactory = {
  // Get the current best provider
  async getProvider(options?: WeatherFactoryOptions): Promise<IWeatherProvider> {
    return getBestProvider(options);
  },

  // Get provider status
  async getProvidersStatus(): Promise<
    Array<{
      name: ApiProvider;
      available: boolean;
      remainingCalls: number;
      dailyLimit: number;
      priority: number;
    }>
  > {
    const status = [];

    for (const [name, provider] of providers) {
      const [available, remainingCalls] = await Promise.all([
        provider.isAvailable(),
        provider.getRemainingCalls(),
      ]);

      status.push({
        name,
        available,
        remainingCalls,
        dailyLimit: provider.config.dailyLimit,
        priority: provider.config.priority,
      });
    }

    return status.sort((a, b) => a.priority - b.priority);
  },

  // Get combined remaining calls across all providers
  async getTotalRemainingCalls(): Promise<number> {
    let total = 0;
    for (const provider of providers.values()) {
      total += await provider.getRemainingCalls();
    }
    return total;
  },

  // Current weather with automatic fallback
  async getTimelines(
    lat: number,
    lng: number,
    options?: { hours?: number },
    factoryOptions?: WeatherFactoryOptions
  ): Promise<WeatherTimelinesResponse & { provider: ApiProvider }> {
    const sortedProviders = await getSortedProviders(
      factoryOptions?.strategy,
      factoryOptions?.preferredProvider
    );

    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      try {
        const result = await provider.getTimelines(lat, lng, options);
        return { ...result, provider: provider.name };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Provider ${provider.name} failed:`, lastError.message);
      }
    }

    throw lastError || new Error("All weather providers failed");
  },

  // Weather events/alerts with fallback (prioritizes providers with alerts support)
  async getEvents(
    lat: number,
    lng: number,
    radiusKm?: number,
    factoryOptions?: WeatherFactoryOptions
  ): Promise<WeatherEvent[]> {
    // For events, always try Tomorrow.io first as OpenWeather requires paid tier
    const providers = await getSortedProviders(
      factoryOptions?.strategy,
      factoryOptions?.preferredProvider ?? "tomorrow"
    );

    // Filter to only providers that support alerts
    const alertProviders = providers.filter(
      (p) => p.config.supportedFeatures.alerts
    );

    if (alertProviders.length === 0) {
      // Try Tomorrow.io anyway as it might work
      try {
        return await tomorrowIoProvider.getEvents(lat, lng, radiusKm);
      } catch {
        return [];
      }
    }

    for (const provider of alertProviders) {
      try {
        return await provider.getEvents(lat, lng, radiusKm);
      } catch (error) {
        console.warn(`Provider ${provider.name} events failed:`, error);
      }
    }

    return [];
  },

  // Route analysis with smart provider selection
  async analyzeRoute(
    points: Array<{ lat: number; lng: number; km: number }>,
    factoryOptions?: WeatherFactoryOptions
  ): Promise<RouteAnalysisResponse & { provider: ApiProvider }> {
    // Estimate required calls (1 call per sampled point)
    const estimatedCalls = Math.min(points.length, 10);

    const provider = await getProviderForBulkOperation(
      estimatedCalls,
      factoryOptions
    );

    const result = await provider.analyzeRoute(points);
    return { ...result, provider: provider.name };
  },

  // Hybrid route analysis: split between providers if needed
  async analyzeRouteHybrid(
    points: Array<{ lat: number; lng: number; km: number }>
  ): Promise<RouteAnalysisResponse & { providers: ApiProvider[] }> {
    const maxPointsPerProvider = 5;
    const segments: RouteAnalysisResponse["segments"] = [];
    const usedProviders: Set<ApiProvider> = new Set();

    // Sample points evenly
    const sampleStep = Math.max(1, Math.floor(points.length / 10));
    const sampledPoints = points.filter((_, i) => i % sampleStep === 0);

    // Split points across available providers
    let currentPointIndex = 0;

    for (const provider of providers.values()) {
      if (currentPointIndex >= sampledPoints.length) break;

      const remaining = await provider.getRemainingCalls();
      if (remaining <= 0) continue;

      const pointsToFetch = Math.min(
        maxPointsPerProvider,
        remaining,
        sampledPoints.length - currentPointIndex
      );

      const pointSlice = sampledPoints.slice(
        currentPointIndex,
        currentPointIndex + pointsToFetch
      );

      try {
        const result = await provider.analyzeRoute(pointSlice);
        segments.push(...result.segments);
        usedProviders.add(provider.name);
        currentPointIndex += pointsToFetch;
      } catch (error) {
        console.warn(`Provider ${provider.name} route analysis failed:`, error);
      }
    }

    if (segments.length === 0) {
      throw new Error("Failed to analyze route with any provider");
    }

    // Sort segments by km
    segments.sort((a, b) => a.km - b.km);

    // Calculate overall risk
    const riskPriority = { low: 0, moderate: 1, high: 2, extreme: 3 };
    const overallRisk = segments.reduce(
      (highest, s) =>
        riskPriority[s.weather.roadRisk] > riskPriority[highest]
          ? s.weather.roadRisk
          : highest,
      "low" as const
    );

    return {
      segments,
      overallRisk,
      providers: Array.from(usedProviders),
    };
  },
};

// Export individual providers for direct access
export { tomorrowIoProvider, openWeatherProvider };

// Export types
export type { IWeatherProvider, WeatherFactoryOptions };
