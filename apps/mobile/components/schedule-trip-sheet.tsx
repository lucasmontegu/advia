import { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { useScheduledTripsStore } from '@/stores/scheduled-trips-store';
import * as Notifications from 'expo-notifications';

type RouteData = {
  id: string;
  name: string;
  originName: string;
  destinationName: string;
  originCoordinates: { latitude: number; longitude: number };
  destinationCoordinates: { latitude: number; longitude: number };
};

type ScheduleTripSheetProps = {
  route: RouteData;
  isVisible: boolean;
  onClose: () => void;
  onScheduled?: (tripId: string) => void;
};

const QUICK_DATES = [
  { label: 'Hoy', days: 0 },
  { label: 'Mañana', days: 1 },
  { label: 'Pasado', days: 2 },
];

const QUICK_TIMES = [
  { label: '06:00', hours: 6, minutes: 0 },
  { label: '08:00', hours: 8, minutes: 0 },
  { label: '10:00', hours: 10, minutes: 0 },
  { label: '12:00', hours: 12, minutes: 0 },
  { label: '14:00', hours: 14, minutes: 0 },
  { label: '16:00', hours: 16, minutes: 0 },
  { label: '18:00', hours: 18, minutes: 0 },
  { label: '20:00', hours: 20, minutes: 0 },
];

const NOTIFY_HOURS_OPTIONS = [2, 4, 6, 8, 12, 24];
const FREQUENCY_OPTIONS = [
  { label: 'Cada 1h', value: 1 },
  { label: 'Cada 2h', value: 2 },
  { label: 'Cada 3h', value: 3 },
];

export function ScheduleTripSheet({
  route,
  isVisible,
  onClose,
  onScheduled,
}: ScheduleTripSheetProps) {
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);

  const addTrip = useScheduledTripsStore((state) => state.addTrip);

  // State for selections
  const [selectedDateIndex, setSelectedDateIndex] = useState(1); // Default: tomorrow
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(1); // Default: 08:00
  const [notifyHoursBefore, setNotifyHoursBefore] = useState(6);
  const [notifyFrequency, setNotifyFrequency] = useState(2);

  // Slider animation
  const sliderPosition = useSharedValue(2); // Index in NOTIFY_HOURS_OPTIONS (6h)

  const handleNotifyHoursChange = useCallback((index: number) => {
    sliderPosition.value = withTiming(index, { duration: 200 });
    setNotifyHoursBefore(NOTIFY_HOURS_OPTIONS[index] ?? 6);
  }, [sliderPosition]);

  const getDepartureDate = useCallback(() => {
    const now = new Date();
    const date = new Date(now);
    date.setDate(date.getDate() + (QUICK_DATES[selectedDateIndex]?.days ?? 0));

    const time = QUICK_TIMES[selectedTimeIndex];
    if (time) {
      date.setHours(time.hours, time.minutes, 0, 0);
    }

    return date;
  }, [selectedDateIndex, selectedTimeIndex]);

  const formatDepartureDate = useCallback(() => {
    const date = getDepartureDate();
    const dayLabel = QUICK_DATES[selectedDateIndex]?.label ?? '';
    const timeLabel = QUICK_TIMES[selectedTimeIndex]?.label ?? '';

    const dateStr = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${dayLabel} (${dateStr}) a las ${timeLabel}`;
  }, [getDepartureDate, selectedDateIndex, selectedTimeIndex]);

  const handleSchedule = useCallback(async () => {
    const departureDate = getDepartureDate();

    // Validate departure is in the future
    if (departureDate <= new Date()) {
      // Could show an error here
      return;
    }

    const tripId = addTrip({
      routeId: route.id,
      routeName: route.name,
      originName: route.originName,
      destinationName: route.destinationName,
      originCoordinates: route.originCoordinates,
      destinationCoordinates: route.destinationCoordinates,
      departureTime: departureDate.toISOString(),
      notifyHoursBefore,
      notifyFrequencyHours: notifyFrequency,
    });

    // Schedule notifications
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        // Schedule first notification
        const firstNotifyTime = new Date(departureDate);
        firstNotifyTime.setHours(firstNotifyTime.getHours() - notifyHoursBefore);

        if (firstNotifyTime > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🚗 Tu viaje en ${notifyHoursBefore}h`,
              body: `${route.originName} → ${route.destinationName}. Tocá para ver el clima.`,
              data: { tripId, routeId: route.id, type: 'scheduled_trip' },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: firstNotifyTime,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }

    onScheduled?.(tripId);
    onClose();
  }, [
    getDepartureDate,
    addTrip,
    route,
    notifyHoursBefore,
    notifyFrequency,
    onScheduled,
    onClose,
  ]);

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
      enablePanDownToClose
      onClose={onClose}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Programar viaje
          </Text>
          <Text style={[styles.routeName, { color: colors.mutedForeground }]}>
            {route.originName} → {route.destinationName}
          </Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="clock" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              ¿Cuándo salís?
            </Text>
          </View>

          {/* Quick date buttons */}
          <View style={styles.optionsRow}>
            {QUICK_DATES.map((date, index) => (
              <TouchableOpacity
                key={date.label}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedDateIndex === index ? colors.primary : colors.muted,
                    borderColor: selectedDateIndex === index ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedDateIndex(index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: selectedDateIndex === index ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {date.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time grid */}
          <View style={styles.timeGrid}>
            {QUICK_TIMES.map((time, index) => (
              <TouchableOpacity
                key={time.label}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: selectedTimeIndex === index ? colors.primary : colors.muted,
                    borderColor: selectedTimeIndex === index ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedTimeIndex(index)}
              >
                <Text
                  style={[
                    styles.timeText,
                    {
                      color: selectedTimeIndex === index ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notify Hours Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="notification" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Notificarme desde
            </Text>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              {NOTIFY_HOURS_OPTIONS.map((hours, index) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.sliderPoint,
                    {
                      backgroundColor: index <= NOTIFY_HOURS_OPTIONS.indexOf(notifyHoursBefore)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => handleNotifyHoursChange(index)}
                />
              ))}
            </View>
            <View style={styles.sliderLabels}>
              {NOTIFY_HOURS_OPTIONS.map((hours) => (
                <Text
                  key={hours}
                  style={[
                    styles.sliderLabel,
                    {
                      color: hours === notifyHoursBefore ? colors.primary : colors.mutedForeground,
                      fontFamily: hours === notifyHoursBefore ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    },
                  ]}
                >
                  {hours}h
                </Text>
              ))}
            </View>
          </View>

          <Text style={[styles.notifyDescription, { color: colors.mutedForeground }]}>
            Recibirás informes del clima {notifyHoursBefore} horas antes de salir
          </Text>
        </View>

        {/* Frequency Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Frecuencia de informes
            </Text>
          </View>

          <View style={styles.optionsRow}>
            {FREQUENCY_OPTIONS.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: notifyFrequency === freq.value ? colors.primary : colors.muted,
                    borderColor: notifyFrequency === freq.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setNotifyFrequency(freq.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: notifyFrequency === freq.value ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
          <Icon name="route" size={24} color={colors.primary} />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              {formatDepartureDate()}
            </Text>
            <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
              Informes cada {notifyFrequency}h desde {notifyHoursBefore}h antes
            </Text>
          </View>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity
          style={[styles.scheduleButton, { backgroundColor: colors.primary }]}
          onPress={handleSchedule}
          activeOpacity={0.8}
        >
          <Icon name="check" size={20} color={colors.primaryForeground} />
          <Text style={[styles.scheduleButtonText, { color: colors.primaryForeground }]}>
            Programar viaje
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  routeName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  timeButton: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    position: 'relative',
  },
  sliderPoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: 30,
  },
  notifyDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  summarySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  scheduleButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
