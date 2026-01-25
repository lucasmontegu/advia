// apps/mobile/hooks/use-offline-mode.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useCallback, useEffect, useMemo, useState } from "react";

// ============ Cache Configuration ============

const CACHE_KEYS = {
	ROUTES: "@driwet/cached-routes",
	WEATHER: "@driwet/cached-weather",
	USER_PREFERENCES: "@driwet/user-preferences",
	LAST_LOCATION: "@driwet/last-location",
} as const;

// Cache expiration times
const CACHE_TTL = {
	ROUTES: 7 * 24 * 60 * 60 * 1000, // 7 days
	WEATHER: 30 * 60 * 1000, // 30 minutes
	USER_PREFERENCES: Number.POSITIVE_INFINITY, // Never expires
	LAST_LOCATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Maximum cached items
const MAX_CACHED_ROUTES = 10;
const MAX_CACHED_WEATHER = 20;

// ============ Types ============

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	expiresAt: number;
}

interface CachedRoute {
	id: string;
	origin: { latitude: number; longitude: number; name?: string };
	destination: { latitude: number; longitude: number; name?: string };
	waypoints?: { latitude: number; longitude: number }[];
	distance: number;
	duration: number;
	geometry: string;
}

interface CachedWeather {
	locationKey: string;
	latitude: number;
	longitude: number;
	current: {
		temperature: number;
		condition: string;
		icon: string;
	};
	forecast?: {
		time: string;
		temperature: number;
		condition: string;
	}[];
}

interface UseOfflineModeReturn {
	isOnline: boolean;
	isOffline: boolean;
	connectionType: string | null;
	// Cache operations
	cacheRoute: (route: CachedRoute) => Promise<void>;
	getCachedRoute: (routeId: string) => Promise<CachedRoute | null>;
	getCachedRoutes: () => Promise<CachedRoute[]>;
	cacheWeather: (weather: CachedWeather) => Promise<void>;
	getCachedWeather: (lat: number, lng: number) => Promise<CachedWeather | null>;
	cacheLocation: (lat: number, lng: number) => Promise<void>;
	getLastLocation: () => Promise<{
		latitude: number;
		longitude: number;
	} | null>;
	// Cache management
	clearCache: () => Promise<void>;
	getCacheSize: () => Promise<{ routes: number; weather: number }>;
}

// ============ Hook ============

/**
 * Hook for offline mode functionality with caching
 *
 * @example
 * const { isOffline, cacheRoute, getCachedRoutes } = useOfflineMode();
 *
 * // Cache a route when online
 * if (!isOffline) {
 *   await cacheRoute(routeData);
 * }
 *
 * // Use cached data when offline
 * if (isOffline) {
 *   const routes = await getCachedRoutes();
 * }
 */
export function useOfflineMode(): UseOfflineModeReturn {
	const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

	// Subscribe to network changes
	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			setNetworkState(state);
		});

		// Get initial state
		NetInfo.fetch().then(setNetworkState);

		return () => {
			unsubscribe();
		};
	}, []);

	const isOnline = useMemo(() => {
		return networkState?.isConnected ?? true;
	}, [networkState]);

	const isOffline = useMemo(() => {
		return !isOnline;
	}, [isOnline]);

	const connectionType = useMemo(() => {
		return networkState?.type ?? null;
	}, [networkState]);

	// ============ Route Caching ============

	const cacheRoute = useCallback(async (route: CachedRoute): Promise<void> => {
		try {
			const cached = await AsyncStorage.getItem(CACHE_KEYS.ROUTES);
			const routes: CacheEntry<CachedRoute>[] = cached
				? JSON.parse(cached)
				: [];

			// Remove existing route with same ID
			const filtered = routes.filter((r) => r.data.id !== route.id);

			// Add new route
			const entry: CacheEntry<CachedRoute> = {
				data: route,
				timestamp: Date.now(),
				expiresAt: Date.now() + CACHE_TTL.ROUTES,
			};

			// Prepend and limit to max
			const updated = [entry, ...filtered].slice(0, MAX_CACHED_ROUTES);

			await AsyncStorage.setItem(CACHE_KEYS.ROUTES, JSON.stringify(updated));
		} catch (error) {
			console.error("Failed to cache route:", error);
		}
	}, []);

	const getCachedRoute = useCallback(
		async (routeId: string): Promise<CachedRoute | null> => {
			try {
				const cached = await AsyncStorage.getItem(CACHE_KEYS.ROUTES);
				if (!cached) return null;

				const routes: CacheEntry<CachedRoute>[] = JSON.parse(cached);
				const entry = routes.find((r) => r.data.id === routeId);

				if (!entry) return null;

				// Check expiration
				if (Date.now() > entry.expiresAt) {
					return null;
				}

				return entry.data;
			} catch (error) {
				console.error("Failed to get cached route:", error);
				return null;
			}
		},
		[],
	);

	const getCachedRoutes = useCallback(async (): Promise<CachedRoute[]> => {
		try {
			const cached = await AsyncStorage.getItem(CACHE_KEYS.ROUTES);
			if (!cached) return [];

			const routes: CacheEntry<CachedRoute>[] = JSON.parse(cached);
			const now = Date.now();

			// Filter expired entries
			const valid = routes.filter((r) => now < r.expiresAt);

			return valid.map((r) => r.data);
		} catch (error) {
			console.error("Failed to get cached routes:", error);
			return [];
		}
	}, []);

	// ============ Weather Caching ============

	const generateLocationKey = (lat: number, lng: number): string => {
		// Round to 2 decimal places for location grouping (~1km precision)
		const roundedLat = Math.round(lat * 100) / 100;
		const roundedLng = Math.round(lng * 100) / 100;
		return `${roundedLat},${roundedLng}`;
	};

	const cacheWeather = useCallback(
		async (weather: CachedWeather): Promise<void> => {
			try {
				const cached = await AsyncStorage.getItem(CACHE_KEYS.WEATHER);
				const weathers: CacheEntry<CachedWeather>[] = cached
					? JSON.parse(cached)
					: [];

				const locationKey = generateLocationKey(
					weather.latitude,
					weather.longitude,
				);

				// Remove existing weather for same location
				const filtered = weathers.filter(
					(w) => w.data.locationKey !== locationKey,
				);

				// Add new weather
				const entry: CacheEntry<CachedWeather> = {
					data: { ...weather, locationKey },
					timestamp: Date.now(),
					expiresAt: Date.now() + CACHE_TTL.WEATHER,
				};

				// Prepend and limit
				const updated = [entry, ...filtered].slice(0, MAX_CACHED_WEATHER);

				await AsyncStorage.setItem(CACHE_KEYS.WEATHER, JSON.stringify(updated));
			} catch (error) {
				console.error("Failed to cache weather:", error);
			}
		},
		[],
	);

	const getCachedWeather = useCallback(
		async (lat: number, lng: number): Promise<CachedWeather | null> => {
			try {
				const cached = await AsyncStorage.getItem(CACHE_KEYS.WEATHER);
				if (!cached) return null;

				const weathers: CacheEntry<CachedWeather>[] = JSON.parse(cached);
				const locationKey = generateLocationKey(lat, lng);

				const entry = weathers.find((w) => w.data.locationKey === locationKey);

				if (!entry) return null;

				// Check expiration
				if (Date.now() > entry.expiresAt) {
					return null;
				}

				return entry.data;
			} catch (error) {
				console.error("Failed to get cached weather:", error);
				return null;
			}
		},
		[],
	);

	// ============ Location Caching ============

	const cacheLocation = useCallback(
		async (lat: number, lng: number): Promise<void> => {
			try {
				const entry: CacheEntry<{ latitude: number; longitude: number }> = {
					data: { latitude: lat, longitude: lng },
					timestamp: Date.now(),
					expiresAt: Date.now() + CACHE_TTL.LAST_LOCATION,
				};
				await AsyncStorage.setItem(
					CACHE_KEYS.LAST_LOCATION,
					JSON.stringify(entry),
				);
			} catch (error) {
				console.error("Failed to cache location:", error);
			}
		},
		[],
	);

	const getLastLocation = useCallback(async (): Promise<{
		latitude: number;
		longitude: number;
	} | null> => {
		try {
			const cached = await AsyncStorage.getItem(CACHE_KEYS.LAST_LOCATION);
			if (!cached) return null;

			const entry: CacheEntry<{ latitude: number; longitude: number }> =
				JSON.parse(cached);

			// Check expiration
			if (Date.now() > entry.expiresAt) {
				return null;
			}

			return entry.data;
		} catch (error) {
			console.error("Failed to get last location:", error);
			return null;
		}
	}, []);

	// ============ Cache Management ============

	const clearCache = useCallback(async (): Promise<void> => {
		try {
			await Promise.all([
				AsyncStorage.removeItem(CACHE_KEYS.ROUTES),
				AsyncStorage.removeItem(CACHE_KEYS.WEATHER),
				AsyncStorage.removeItem(CACHE_KEYS.LAST_LOCATION),
			]);
		} catch (error) {
			console.error("Failed to clear cache:", error);
		}
	}, []);

	const getCacheSize = useCallback(async (): Promise<{
		routes: number;
		weather: number;
	}> => {
		try {
			const [routesData, weatherData] = await Promise.all([
				AsyncStorage.getItem(CACHE_KEYS.ROUTES),
				AsyncStorage.getItem(CACHE_KEYS.WEATHER),
			]);

			const routes: CacheEntry<CachedRoute>[] = routesData
				? JSON.parse(routesData)
				: [];
			const weather: CacheEntry<CachedWeather>[] = weatherData
				? JSON.parse(weatherData)
				: [];

			return {
				routes: routes.length,
				weather: weather.length,
			};
		} catch (error) {
			console.error("Failed to get cache size:", error);
			return { routes: 0, weather: 0 };
		}
	}, []);

	return {
		isOnline,
		isOffline,
		connectionType,
		cacheRoute,
		getCachedRoute,
		getCachedRoutes,
		cacheWeather,
		getCachedWeather,
		cacheLocation,
		getLastLocation,
		clearCache,
		getCacheSize,
	};
}

// ============ Offline Indicator Hook ============

/**
 * Simple hook for checking network status
 */
export function useNetworkStatus() {
	const [isConnected, setIsConnected] = useState<boolean | null>(null);

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			setIsConnected(state.isConnected);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return {
		isConnected,
		isOffline: isConnected === false,
		isPending: isConnected === null,
	};
}
