import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/query-client';
import { useLocation } from './use-location';

type RoadRisk = 'low' | 'moderate' | 'high' | 'extreme';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  visibility: number;
  precipitationIntensity: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'hail';
  weatherCode: number;
  uvIndex: number;
  cloudCover: number;
  roadRisk: RoadRisk;
}

interface WeatherAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  startTime?: string;
  endTime?: string;
}

interface UseWeatherMonitorOptions {
  destinationLat?: number;
  destinationLng?: number;
  enabled?: boolean;
  onAlertDetected?: (alerts: WeatherAlert[]) => void;
  onRiskChange?: (risk: RoadRisk, previousRisk: RoadRisk | null) => void;
}

interface UseWeatherMonitorReturn {
  currentWeather: WeatherData | null;
  aheadWeather: Array<{ km: number; weather: WeatherData }>;
  alerts: WeatherAlert[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  nextUpdateIn: number; // milliseconds
  hasActiveAlerts: boolean;
  highestRisk: RoadRisk;
  refresh: () => void;
}

const DEFAULT_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes
const FAST_UPDATE_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function useWeatherMonitor(
  options: UseWeatherMonitorOptions = {}
): UseWeatherMonitorReturn {
  const {
    destinationLat,
    destinationLng,
    enabled = true,
    onAlertDetected,
    onRiskChange,
  } = options;

  const { location } = useLocation();
  const queryClient = useQueryClient();
  const previousRiskRef = useRef<RoadRisk | null>(null);
  const [nextUpdateMs, setNextUpdateMs] = useState(DEFAULT_UPDATE_INTERVAL);

  // Determine if we're in trip mode (have a destination)
  const isTripMode = destinationLat !== undefined && destinationLng !== undefined;

  // Query for current weather at user's location
  const currentWeatherQuery = useQuery({
    queryKey: ['weather', 'current', location?.latitude, location?.longitude],
    queryFn: () =>
      api.weather.getCurrent.call({
        lat: location!.latitude,
        lng: location!.longitude,
      }),
    enabled: enabled && !!location,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: nextUpdateMs,
  });

  // Query for route updates (only when in trip mode)
  const routeUpdatesQuery = useQuery({
    queryKey: [
      'weather',
      'routeUpdates',
      location?.latitude,
      location?.longitude,
      destinationLat,
      destinationLng,
    ],
    queryFn: () =>
      api.weather.getRouteUpdates.call({
        currentLat: location!.latitude,
        currentLng: location!.longitude,
        destinationLat: destinationLat!,
        destinationLng: destinationLng!,
        hasActiveAlerts: false, // Will be updated dynamically
      }),
    enabled: enabled && !!location && isTripMode,
    staleTime: 3 * 60 * 1000,
    refetchInterval: nextUpdateMs,
  });

  // Query for alerts near user
  const alertsQuery = useQuery({
    queryKey: ['weather', 'alerts', location?.latitude, location?.longitude],
    queryFn: () =>
      api.weather.getAlerts.call({
        lat: location!.latitude,
        lng: location!.longitude,
        radiusKm: 50,
      }),
    enabled: enabled && !!location,
    staleTime: 5 * 60 * 1000,
    refetchInterval: nextUpdateMs,
  });

  // Extract weather data
  const currentWeather = isTripMode
    ? routeUpdatesQuery.data?.current ?? currentWeatherQuery.data?.data ?? null
    : currentWeatherQuery.data?.data ?? null;

  const aheadWeather = routeUpdatesQuery.data?.ahead ?? [];
  const alerts = alertsQuery.data?.alerts ?? [];
  const hasActiveAlerts = alerts.length > 0;

  // Calculate highest risk along route
  const highestRisk: RoadRisk = (() => {
    const risks: RoadRisk[] = [currentWeather?.roadRisk ?? 'low'];
    aheadWeather.forEach((w) => risks.push(w.weather.roadRisk));

    const priority: Record<RoadRisk, number> = {
      low: 0,
      moderate: 1,
      high: 2,
      extreme: 3,
    };

    return risks.reduce((highest, risk) => {
      return priority[risk] > priority[highest] ? risk : highest;
    }, 'low' as RoadRisk);
  })();

  // Update interval based on conditions
  useEffect(() => {
    const serverSuggestedInterval = routeUpdatesQuery.data?.nextUpdateMs;

    if (serverSuggestedInterval) {
      setNextUpdateMs(serverSuggestedInterval);
    } else if (hasActiveAlerts || highestRisk === 'high' || highestRisk === 'extreme') {
      setNextUpdateMs(FAST_UPDATE_INTERVAL);
    } else {
      setNextUpdateMs(DEFAULT_UPDATE_INTERVAL);
    }
  }, [hasActiveAlerts, highestRisk, routeUpdatesQuery.data?.nextUpdateMs]);

  // Callback for alert detection
  useEffect(() => {
    if (alerts.length > 0 && onAlertDetected) {
      onAlertDetected(alerts);
    }
  }, [alerts, onAlertDetected]);

  // Callback for risk change
  useEffect(() => {
    if (currentWeather && onRiskChange) {
      const currentRisk = highestRisk;
      const previousRisk = previousRiskRef.current;

      if (previousRisk !== null && previousRisk !== currentRisk) {
        onRiskChange(currentRisk, previousRisk);
      }

      previousRiskRef.current = currentRisk;
    }
  }, [highestRisk, onRiskChange, currentWeather]);

  // Manual refresh function
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['weather'] });
  }, [queryClient]);

  // Determine last update time
  const lastUpdate = currentWeatherQuery.data?.fetchedAt
    ? new Date(currentWeatherQuery.data.fetchedAt)
    : routeUpdatesQuery.data?.fetchedAt
    ? new Date(routeUpdatesQuery.data.fetchedAt)
    : null;

  return {
    currentWeather,
    aheadWeather,
    alerts,
    isLoading:
      currentWeatherQuery.isLoading ||
      routeUpdatesQuery.isLoading ||
      alertsQuery.isLoading,
    error:
      currentWeatherQuery.error ??
      routeUpdatesQuery.error ??
      alertsQuery.error ??
      null,
    lastUpdate,
    nextUpdateIn: nextUpdateMs,
    hasActiveAlerts,
    highestRisk,
    refresh,
  };
}
