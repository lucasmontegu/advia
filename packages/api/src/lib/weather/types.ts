import type {
	ApiProvider,
	RoadRisk,
	WeatherData,
	WeatherSource,
} from "@driwet/db/schema/index";

// Re-export types from DB
export type { WeatherData, RoadRisk, WeatherSource, ApiProvider };

// Provider configuration
export interface ProviderConfig {
	name: ApiProvider;
	dailyLimit: number;
	priority: number; // Lower = higher priority
	supportedFeatures: {
		current: boolean;
		forecast: boolean;
		alerts: boolean;
		historical: boolean;
	};
}

// Weather event/alert from providers
export interface WeatherEvent {
	id: string;
	type: string;
	severity: string;
	title: string;
	description: string;
	startTime: string;
	endTime: string;
}

// Hourly forecast entry
export interface HourlyForecast {
	time: string;
	weather: WeatherData;
}

// Weather timelines response
export interface WeatherTimelinesResponse {
	current: WeatherData;
	hourly: HourlyForecast[];
}

// Route analysis response
export interface RouteAnalysisResponse {
	segments: Array<{
		km: number;
		lat: number;
		lng: number;
		weather: WeatherData;
	}>;
	overallRisk: RoadRisk;
}

// Weather provider interface - all providers must implement this
export interface IWeatherProvider {
	readonly name: ApiProvider;
	readonly config: ProviderConfig;

	// Core methods
	getTimelines(
		lat: number,
		lng: number,
		options?: { hours?: number },
	): Promise<WeatherTimelinesResponse>;

	getEvents(
		lat: number,
		lng: number,
		radiusKm?: number,
	): Promise<WeatherEvent[]>;

	analyzeRoute(
		points: Array<{ lat: number; lng: number; km: number }>,
	): Promise<RouteAnalysisResponse>;

	// Utility methods
	isAvailable(): Promise<boolean>;
	getRemainingCalls(): Promise<number>;
}

// Region types for pricing
export type Region =
	| "south_america"
	| "north_america"
	| "europe"
	| "asia"
	| "oceania"
	| "africa";

// Pricing tier by region
export interface RegionPricing {
	region: Region;
	monthlyPrice: number; // in USD cents
	yearlyPrice: number; // in USD cents
	currency: string;
	currencySymbol: string;
}

// Coordinates for region detection
export interface Coordinates {
	lat: number;
	lng: number;
}

// Provider selection strategy
export type ProviderStrategy = "cost_optimized" | "performance" | "reliability";

// Factory options
export interface WeatherFactoryOptions {
	strategy?: ProviderStrategy;
	preferredProvider?: ApiProvider;
	region?: Region;
}
