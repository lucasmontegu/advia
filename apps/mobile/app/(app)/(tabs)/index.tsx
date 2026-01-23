// apps/mobile/app/(app)/(tabs)/index.tsx
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useLocation } from '@/hooks/use-location';
import { useActiveAlerts, useCurrentWeather } from '@/hooks/use-api';
import { useRouteDirections } from '@/hooks/use-route-directions';
import { usePaywall } from '@/hooks/use-paywall';
import { MapViewComponent, type WeatherAlert } from '@/components/map-view';
import { ChatInput, type RouteLocation } from '@/components/chat-input';
import { RouteChips } from '@/components/route-chips';
import { SuggestionsSheet } from '@/components/suggestions-sheet';
import { WeatherOverlay } from '@/components/weather/weather-overlay';
import { UpcomingTripBanner } from '@/components/upcoming-trip-banner';
import { TrialBanner, PaywallModal } from '@/components/subscription';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { location, isLoading: locationLoading } = useLocation();

  // Subscription/Trial state
  const paywall = usePaywall({ autoShowOnTrialExpiry: true });

  // Check trial status on mount
  useEffect(() => {
    paywall.checkTrialStatus();
  }, []);

  // Route state
  const [origin, setOrigin] = useState<RouteLocation | null>(null);
  const [destination, setDestination] = useState<RouteLocation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  const handleClearRoute = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setShowSuggestions(false);
  }, []);

  const handleChatSubmit = useCallback(async (message: string) => {
    setIsChatLoading(true);
    try {
      // TODO: Integrate with chat API
      console.log('Chat message:', message);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsChatLoading(false);
    }
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
    alerts: alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.headline || 'Alerta meteorologica',
      kmRange: '',
    })),
    stops: [] as Array<{ id: string; name: string; type: 'gas' | 'rest' | 'food'; km: number; reason: string }>,
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

        {/* Top overlay elements */}
        <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          {/* Trial Countdown Banner */}
          <TrialBanner />

          {/* Upcoming Trip Banner */}
          <View style={styles.bannerContainer}>
            <UpcomingTripBanner onViewDetails={handleViewTripDetails} />
          </View>

          {/* Weather Card - Floating top right (only when no route) */}
          {!hasRoute && (
            <View
              style={styles.weatherCardContainer}
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

        {/* Bottom section - Chat Input and Route Chips */}
        <View style={styles.bottomSection} pointerEvents="box-none">
          {/* Route Chips - shown when route is active */}
          {hasRoute && !showSuggestions && (
            <View style={styles.routeChipsContainer}>
              <RouteChips
                origin={origin}
                destination={destination}
                distance={routeDirections?.distance}
                duration={routeDirections?.duration}
                onClear={handleClearRoute}
              />
            </View>
          )}

          {/* Chat Input - always visible (hidden when suggestions visible) */}
          {!showSuggestions && (
            <ChatInput
              origin={origin}
              destination={destination}
              onRouteChange={handleRouteChange}
              onChatSubmit={handleChatSubmit}
              isLoading={isChatLoading}
            />
          )}
        </View>

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

        {/* Paywall Modal - shown when trial expires */}
        <PaywallModal
          visible={paywall.isVisible}
          onDismiss={paywall.dismiss}
          allowDismiss={paywall.canDismiss}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  bannerContainer: {
    marginBottom: 8,
  },
  weatherCardContainer: {
    position: 'absolute',
    right: 16,
    top: 70,
    maxWidth: 120,
  },
  suggestionsFab: {
    position: 'absolute',
    top: 70,
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
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  routeChipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
