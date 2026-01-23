// apps/mobile/components/route-chips.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';

export type RouteLocation = {
  name: string;
  coordinates: { latitude: number; longitude: number };
};

type RouteChipsProps = {
  origin: RouteLocation;
  destination: RouteLocation;
  distance?: number; // in km
  duration?: number; // in minutes
  onClear: () => void;
  onEditOrigin?: () => void;
  onEditDestination?: () => void;
};

export function RouteChips({
  origin,
  destination,
  distance,
  duration,
  onClear,
  onEditOrigin,
  onEditDestination,
}: RouteChipsProps) {
  const colors = useThemeColors();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(20)}
      exiting={SlideOutUp.springify().damping(20)}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      <View style={styles.chipsRow}>
        {/* Origin chip */}
        <TouchableOpacity
          onPress={onEditOrigin}
          style={[styles.chip, { backgroundColor: colors.primary + '15' }]}
          activeOpacity={0.7}
        >
          <View style={[styles.chipDot, { backgroundColor: colors.primary }]} />
          <Text
            style={[styles.chipText, { color: colors.primary }]}
            numberOfLines={1}
          >
            {origin.name}
          </Text>
        </TouchableOpacity>

        {/* Arrow */}
        <Icon name="route" size={16} color={colors.mutedForeground} />

        {/* Destination chip */}
        <TouchableOpacity
          onPress={onEditDestination}
          style={[styles.chip, { backgroundColor: colors.safe + '15' }]}
          activeOpacity={0.7}
        >
          <View style={[styles.chipDot, { backgroundColor: colors.safe }]} />
          <Text
            style={[styles.chipText, { color: colors.safe }]}
            numberOfLines={1}
          >
            {destination.name}
          </Text>
        </TouchableOpacity>

        {/* Clear button */}
        <TouchableOpacity
          onPress={onClear}
          style={[styles.clearButton, { backgroundColor: colors.muted }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Route info (distance & duration) */}
      {(distance !== undefined || duration !== undefined) && (
        <View style={styles.infoRow}>
          {distance !== undefined && (
            <View style={styles.infoItem}>
              <Icon name="route" size={12} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {distance.toFixed(1)} km
              </Text>
            </View>
          )}
          {duration !== undefined && (
            <View style={styles.infoItem}>
              <Icon name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {formatDuration(duration)}
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    maxWidth: '40%',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    flexShrink: 1,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
