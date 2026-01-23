// apps/native/app/(app)/(tabs)/index.tsx
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useLocation } from '@/hooks/use-location';
import { useActiveAlerts, useCurrentWeather } from '@/hooks/use-api';
import { useRouteDirections } from '@/hooks/use-route-directions';
import { MapViewComponent, type WeatherAlert } from '@/components/map-view';
import { ChatInputBar } from '@/components/chat-input-bar';
import { SmartSearchInput } from '@/components/smart-search-input';
import { SuggestionsSheet } from '@/components/suggestions-sheet';
import { WeatherOverlay } from '@/components/weather/weather-overlay';
import { UpcomingTripBanner } from '@/components/upcoming-trip-banner';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

type RouteLocation = {
  name: string;
  coordinates: { latitude: number; longitude: number };
};

export default function MapScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { location, isLoading: locationLoading } = useLocation();

  // Route state
  const [origin, setOrigin] = useState<RouteLocation | null>(null);
  const [destination, setDestination] = useState<RouteLocation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch alerts for current location
  const { data: alertsData } = useActiveAlerts(
    location?.latitude ?? 0,
    location?.longitude ?? 0,
    !locationLoading && location !== null
  );

  // Fetch weather for current location
  const { data: weatherData, isLoading: weatherLoading } = useCurrentWeather(
    location?.latitude ?? 0,
    location?.longitude ?? 0,
    !locationLoading && location !== null
  );

  // Transform API alerts to map format
  const alerts: WeatherAlert[] = (alertsData?.alerts ?? []).map((alert) => ({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    headline: alert.headline,
    polygon: alert.polygon,
  }));

  // Fetch route directions when origin and destination are set
  const { data: routeDirections, isLoading: directionsLoading } = useRouteDirections(
    origin?.coordinates ?? null,
    destination?.coordinates ?? null,
    !!origin && !!destination
  );

  const handleRouteChange = useCallback((newOrigin: RouteLocation | null, newDestination: RouteLocation | null) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    // Show suggestions when route is complete
    if (newOrigin && newDestination) {
      setShowSuggestions(true);
    }
  }, []);

  const handleChatSubmit = useCallback((message: string) => {
    // TODO: Integrate with chat system
    console.log('Chat message:', message);
  }, []);

  const handleToggleSuggestions = useCallback(() => {
    setShowSuggestions((prev) => !prev);
  }, []);

  const hasRoute = origin && destination;

  const handleViewTripDetails = useCallback((trip: { routeId: string }) => {
    router.push(`/route-detail?id=${trip.routeId}`);
  }, [router]);

  // Route data for suggestions sheet
  const routeSuggestionsData = useMemo(() => ({
    distance: routeDirections?.distance ?? 0,
    duration: routeDirections?.duration ?? 0,
    temperature: weatherData?.data?.temperature,
    // Real alerts from API - only show if there are actual alerts in the area
    alerts: alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.headline || 'Alerta meteorológica',
      kmRange: '', // TODO: Calculate actual km range based on route intersection
    })),
    // TODO: Integrate with POI API for suggested stops along route
    stops: [] as Array<{ id: string; name: string; type: 'gas' | 'rest' | 'food'; km: number; reason: string }>,
    // TODO: Integrate with crowd data API for destination info
    destinations: [] as Array<{ name: string; crowdLevel: 'low' | 'medium' | 'high'; currentCount: number; maxCapacity: number }>,
  }), [alerts, weatherData?.data?.temperature, routeDirections]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View
        style={styles.container}
        accessible={false}
        accessibilityLabel={t('map.screenLabel')}
      >
        {/* Fullscreen Map - extends behind notch */}
        <MapViewComponent
          alerts={alerts}
          origin={origin?.coordinates}
          destination={destination?.coordinates}
          routeGeometry={routeDirections?.geometry?.coordinates}
        />

        {/* Floating UI Elements */}
        <View style={[styles.overlayContainer, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          {/* Smart Search Input */}
          <SmartSearchInput
            origin={origin}
            destination={destination}
            onRouteChange={handleRouteChange}
          />

          {/* Upcoming Trip Banner */}
          <UpcomingTripBanner onViewDetails={handleViewTripDetails} />

          {/* Weather Card - Floating top right (only when no route) */}
          {!hasRoute && (
            <View
              style={[styles.weatherCardContainer, { top: insets.top + 70 }]}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={
                weatherData?.data
                  ? `${t('weather.temperature')}: ${Math.round(weatherData.data.temperature)}°C, ${t('weather.risk')}: ${weatherData.data.roadRisk}`
                  : t('weather.loading')
              }
            >
              <WeatherOverlay
                weather={weatherData?.data ? {
                  temperature: weatherData.data.temperature,
                  humidity: weatherData.data.humidity,
                  windSpeed: weatherData.data.windSpeed,
                  visibility: weatherData.data.visibility,
                  precipitationIntensity: weatherData.data.precipitationIntensity,
                  precipitationType: weatherData.data.precipitationType,
                  roadRisk: weatherData.data.roadRisk,
                } : null}
                isLoading={weatherLoading}
                showDetails={false}
              />
            </View>
          )}

          {/* Suggestions FAB - Only when route is set */}
          {hasRoute && !showSuggestions && (
            <TouchableOpacity
              style={[styles.suggestionsFab, { backgroundColor: colors.primary }]}
              onPress={handleToggleSuggestions}
              activeOpacity={0.8}
            >
              <Icon name="info" size={20} color={colors.primaryForeground} />
              <Text style={[styles.suggestionsFabText, { color: colors.primaryForeground }]}>
                Sugerencias
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chat Input Bar - Fixed above tabs (hidden when suggestions visible) */}
        {!showSuggestions && (
          <ChatInputBar onSubmit={handleChatSubmit} />
        )}

        {/* Suggestions Sheet */}
        {hasRoute && showSuggestions && (
          <SuggestionsSheet
            origin={origin}
            destination={destination}
            distance={routeSuggestionsData.distance}
            duration={routeSuggestionsData.duration}
            temperature={routeSuggestionsData.temperature}
            alerts={routeSuggestionsData.alerts}
            stops={routeSuggestionsData.stops}
            destinations={routeSuggestionsData.destinations}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
  },
  weatherCardContainer: {
    position: 'absolute',
    right: 16,
    maxWidth: 120,
  },
  suggestionsFab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  suggestionsFabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
