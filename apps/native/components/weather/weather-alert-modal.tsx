import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { RouteRiskBadge } from './route-risk-badge';

type Severity = 'minor' | 'moderate' | 'severe' | 'extreme';
type RoadRisk = 'low' | 'moderate' | 'high' | 'extreme';

interface WeatherAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

interface WeatherAlertModalProps {
  visible: boolean;
  onClose: () => void;
  alert: WeatherAlert | null;
  distanceKm?: number;
  onViewShelters?: () => void;
  onViewAlternateRoute?: () => void;
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bgColor: string }> = {
  minor: { color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.15)' },
  moderate: { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
  severe: { color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.15)' },
  extreme: { color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.15)' },
};

export function WeatherAlertModal({
  visible,
  onClose,
  alert,
  distanceKm,
  onViewShelters,
  onViewAlternateRoute,
}: WeatherAlertModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (!alert) return null;

  const severity = (alert.severity as Severity) || 'moderate';
  const config = SEVERITY_CONFIG[severity];
  const isUrgent = severity === 'severe' || severity === 'extreme';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: config.bgColor }]}>
            <View style={styles.headerContent}>
              <Icon
                name={isUrgent ? 'storm' : 'alert'}
                size={24}
                color={config.color}
              />
              <View style={styles.headerText}>
                <Text style={[styles.alertType, { color: config.color }]}>
                  {t(`weather.alertTypes.${alert.type}`, { defaultValue: alert.type })}
                </Text>
                <Text style={[styles.alertTitle, { color: colors.foreground }]}>
                  {alert.title}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Distance indicator */}
            {distanceKm !== undefined && (
              <View style={styles.distanceRow}>
                <Icon name="location" size={16} color={colors.mutedForeground} />
                <Text style={[styles.distanceText, { color: colors.foreground }]}>
                  {t('weather.distanceAway', { distance: distanceKm })}
                </Text>
              </View>
            )}

            {/* Description */}
            {alert.description && (
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {alert.description}
              </Text>
            )}

            {/* Risk badge */}
            <View style={styles.riskContainer}>
              <Text style={[styles.riskLabel, { color: colors.mutedForeground }]}>
                {t('weather.roadConditions')}
              </Text>
              <RouteRiskBadge risk={severity === 'extreme' ? 'extreme' : severity === 'severe' ? 'high' : 'moderate'} />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {onViewShelters && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={onViewShelters}
              >
                <Icon name="location" size={18} color={colors.foreground} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>
                  {t('weather.viewShelters')}
                </Text>
              </Pressable>
            )}

            {isUrgent && onViewAlternateRoute && (
              <Pressable
                style={[styles.actionButton, styles.primaryAction, { backgroundColor: colors.primary }]}
                onPress={onViewAlternateRoute}
              >
                <Icon name="route" size={18} color={colors.primaryForeground} />
                <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                  {t('weather.alternateRoute')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  alertType: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 18,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  distanceText: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 14,
  },
  description: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  riskLabel: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    flex: 1.5,
  },
  actionText: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 14,
  },
});
