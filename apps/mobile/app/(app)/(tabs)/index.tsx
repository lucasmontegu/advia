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
import { UpcomingTripBanner } from '@/components/upcoming-trip-banner';
import { TrialBanner, PaywallModal } from '@/components/subscription';
import { SafetyStatusCard, AICopilotButton, EmptyState, type SafetyStatus, type AICopilotState } from '@/components/home';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_PLANNED_TRIP_KEY = '@driwet/has-planned-trip';

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

  // AI Copilot state
  const [copilotState, setCopilotState] = useState<AICopilotState>('idle');
  const [suggestionCount, setSuggestionCount] = useState(0);

  // Empty state tracking - show when user hasn't planned any trip yet
  const [hasPlannedTrip, setHasPlannedTrip] = useState<boolean | null>(null);

  // Load hasPlannedTrip from AsyncStorage on mount
  useEffect(() => {
    const loadHasPlannedTrip = async () => {
      try {
        const value = await AsyncStorage.getItem(HAS_PLANNED_TRIP_KEY);
        setHasPlannedTrip(value === 'true');
      } catch (error) {
        console.error('Failed to load hasPlannedTrip:', error);
        setHasPlannedTrip(false); // Default to showing empty state on error
      }
    };
    loadHasPlannedTrip();
  }, []);

  // Persist hasPlannedTrip changes to AsyncStorage
  const markTripPlanned = useCallback(async () => {
    try {
      await AsyncStorage.setItem(HAS_PLANNED_TRIP_KEY, 'true');
      setHasPlannedTrip(true);
    } catch (error) {
      console.error('Failed to save hasPlannedTrip:', error);
      // Still update state even if storage fails
      setHasPlannedTrip(true);
    }
  }, []);

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

  // Determine safety status based on weather and alerts
  const safetyStatus: SafetyStatus = useMemo(() => {
    if (alerts.length === 0) return 'safe';

    const hasExtreme = alerts.some((a) => a.severity === 'extreme');
    const hasSevere = alerts.some((a) => a.severity === 'severe');
    const hasModerate = alerts.some((a) => a.severity === 'moderate');

    if (hasExtreme) return 'danger';
    if (hasSevere) return 'warning';
    if (hasModerate) return 'caution';
    return 'safe';
  }, [alerts]);

  // Safety status message based on conditions
  const safetyMessage = useMemo(() => {
    if (safetyStatus === 'safe') {
      return t('safetyStatus.safe', { time: '3 PM' });
    }
    if (safetyStatus === 'caution') {
      return t('safetyStatus.caution');
    }
    if (safetyStatus === 'warning') {
      return t('safetyStatus.warning');
    }
    return t('safetyStatus.danger');
  }, [safetyStatus, t]);

  // Detail message for expanded card
  const safetyDetailMessage = useMemo(() => {
    if (alerts.length > 0) {
      return alerts[0].headline || t('safetyStatus.alertDescription');
    }
    return t('safetyStatus.allClear');
  }, [alerts, t]);

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
      markTripPlanned();
    }
  }, [markTripPlanned]);

  const handleClearRoute = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setShowSuggestions(false);
  }, []);

  const handleChatSubmit = useCallback(async (message: string) => {
    setIsChatLoading(true);
    setCopilotState('listening');
    try {
      // TODO: Integrate with chat API
      console.log('Chat message:', message);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCopilotState('speaking');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsChatLoading(false);
      setCopilotState('idle');
    }
  }, []);

  const handleToggleSuggestions = useCallback(() => {
    setShowSuggestions((prev) => !prev);
  }, []);

  const handleCopilotPress = useCallback(() => {
    // Open AI chat interface - for now, show suggestions
    // TODO: Navigate to dedicated chat screen when implemented
    setShowSuggestions(true);
  }, []);

  const handleCopilotLongPress = useCallback(() => {
    // Start voice input
    setCopilotState('listening');
    // TODO: Implement voice recognition
    setTimeout(() => setCopilotState('idle'), 3000);
  }, []);

  const handlePlanTrip = useCallback(() => {
    // Focus on the chat input to plan a trip
    // Mark that user has interacted with the app
    markTripPlanned();
  }, [markTripPlanned]);

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

          {/* Safety Status Card - New AI Co-Pilot feature */}
          {!hasRoute && (
            <SafetyStatusCard
              status={safetyStatus}
              message={safetyMessage}
              detailMessage={safetyDetailMessage}
              temperature={weatherData?.data?.temperature}
            />
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

        {/* Empty State - shown for new users who haven't planned a trip yet */}
        {hasPlannedTrip === false && !hasRoute && (
          <View style={styles.emptyStateContainer}>
            <EmptyState onPlanTrip={handlePlanTrip} />
          </View>
        )}

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

          {/* AI Copilot Button - Floating action button */}
          {!showSuggestions && hasPlannedTrip === true && (
            <View style={styles.copilotButtonContainer}>
              <AICopilotButton
                state={copilotState}
                suggestionCount={suggestionCount}
                onPress={handleCopilotPress}
                onLongPress={handleCopilotLongPress}
              />
            </View>
          )}

          {/* Chat Input - always visible (hidden when suggestions visible) */}
          {!showSuggestions && hasPlannedTrip === true && (
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
  suggestionsFab: {
    position: 'absolute',
    top: 180,
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
  emptyStateContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
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
  copilotButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 10,
  },
});
