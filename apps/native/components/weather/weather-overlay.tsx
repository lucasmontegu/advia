import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { RouteRiskBadge } from './route-risk-badge';

type RoadRisk = 'low' | 'moderate' | 'high' | 'extreme';
type PrecipitationType = 'none' | 'rain' | 'snow' | 'hail';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  precipitationIntensity: number;
  precipitationType: PrecipitationType;
  roadRisk: RoadRisk;
}

interface WeatherOverlayProps {
  weather: WeatherData | null;
  isLoading?: boolean;
  showDetails?: boolean;
}

const PRECIPITATION_ICONS = {
  none: 'check',
  rain: 'storm',
  snow: 'storm',
  hail: 'alert',
} as const;

export function WeatherOverlay({
  weather,
  isLoading = false,
  showDetails = true
}: WeatherOverlayProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          {t('weather.loading')}
        </Text>
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Main temperature and risk */}
      <View style={styles.header}>
        <View style={styles.tempContainer}>
          <Text style={[styles.temperature, { color: colors.foreground }]}>
            {Math.round(weather.temperature)}°
          </Text>
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>C</Text>
        </View>
        <RouteRiskBadge risk={weather.roadRisk} />
      </View>

      {/* Weather details */}
      {showDetails && (
        <View style={styles.details}>
          {/* Wind */}
          <View style={styles.detailItem}>
            <Icon name="route" size={14} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
              {Math.round(weather.windSpeed)} km/h
            </Text>
          </View>

          {/* Visibility */}
          <View style={styles.detailItem}>
            <Icon name="location" size={14} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
              {weather.visibility.toFixed(1)} km
            </Text>
          </View>

          {/* Precipitation */}
          {weather.precipitationType !== 'none' && (
            <View style={styles.detailItem}>
              <Icon
                name={PRECIPITATION_ICONS[weather.precipitationType]}
                size={14}
                color={colors.alert.moderate}
              />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                {weather.precipitationIntensity.toFixed(1)} mm/h
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperature: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 32,
  },
  unit: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  loadingText: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 12,
  },
});
