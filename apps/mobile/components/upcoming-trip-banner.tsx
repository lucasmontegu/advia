import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon, type IconName } from '@/components/icons';
import { useScheduledTripsStore, type ScheduledTrip, type TripRecommendation } from '@/stores/scheduled-trips-store';
import { useEffect, useMemo } from 'react';

type UpcomingTripBannerProps = {
  onViewDetails?: (trip: ScheduledTrip) => void;
  onDismiss?: (tripId: string) => void;
};

const STATUS_CONFIG: Record<
  TripRecommendation['status'],
  { icon: IconName; color: string; bgColor: string }
> = {
  safe: {
    icon: 'checkCircle',
    color: '#22c55e',
    bgColor: '#22c55e15',
  },
  caution: {
    icon: 'alert',
    color: '#eab308',
    bgColor: '#eab30815',
  },
  delay: {
    icon: 'clock',
    color: '#f97316',
    bgColor: '#f9731615',
  },
  danger: {
    icon: 'warning',
    color: '#ef4444',
    bgColor: '#ef444415',
  },
};

export function UpcomingTripBanner({ onViewDetails, onDismiss }: UpcomingTripBannerProps) {
  const colors = useThemeColors();
  const nextTrip = useScheduledTripsStore((state) => state.getNextTrip());
  const deactivateTrip = useScheduledTripsStore((state) => state.deactivateTrip);
  const cleanupPastTrips = useScheduledTripsStore((state) => state.cleanupPastTrips);

  // Cleanup past trips on mount
  useEffect(() => {
    cleanupPastTrips();
  }, [cleanupPastTrips]);

  const timeUntilDeparture = useMemo(() => {
    if (!nextTrip) return null;

    const now = new Date();
    const departure = new Date(nextTrip.departureTime);
    const diffMs = departure.getTime() - now.getTime();

    if (diffMs < 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `en ${days} día${days > 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `en ${hours}h ${minutes}m`;
    }

    return `en ${minutes} minutos`;
  }, [nextTrip]);

  if (!nextTrip || !timeUntilDeparture) return null;

  const recommendation = nextTrip.recommendation || {
    status: 'safe' as const,
    message: 'Analizando ruta...',
    details: 'Cargando información del clima',
  };

  const statusConfig = STATUS_CONFIG[recommendation.status];

  const handleDismiss = () => {
    deactivateTrip(nextTrip.id);
    onDismiss?.(nextTrip.id);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutUp.duration(200)}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="route" size={18} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.foreground }]}>
            Tu viaje {timeUntilDeparture}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="close" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Route */}
      <Text style={[styles.routeText, { color: colors.mutedForeground }]} numberOfLines={1}>
        {nextTrip.originName} → {nextTrip.destinationName}
      </Text>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: statusConfig.bgColor }]}>
        <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color + '20' }]}>
          <Icon name={statusConfig.icon} size={20} color={statusConfig.color} />
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {recommendation.message}
          </Text>
          {recommendation.details && (
            <Text style={[styles.statusDetails, { color: colors.mutedForeground }]} numberOfLines={2}>
              {recommendation.details}
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.detailsButton, { borderColor: colors.border }]}
          onPress={() => onViewDetails?.(nextTrip)}
          activeOpacity={0.7}
        >
          <Text style={[styles.detailsButtonText, { color: colors.foreground }]}>
            Ver detalles
          </Text>
        </TouchableOpacity>

        {recommendation.status === 'delay' && recommendation.suggestedDelay && (
          <View style={[styles.delayBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Icon name="clock" size={14} color={statusConfig.color} />
            <Text style={[styles.delayText, { color: statusConfig.color }]}>
              Esperá {Math.round(recommendation.suggestedDelay / 60)}h
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  routeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  statusDetails: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  detailsButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  delayText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
