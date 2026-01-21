import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';

type RoadRisk = 'low' | 'moderate' | 'high' | 'extreme';

interface RouteRiskBadgeProps {
  risk: RoadRisk;
  compact?: boolean;
}

const RISK_CONFIG = {
  low: {
    label: 'weather.risk.low',
    icon: 'check' as const,
    bgColor: 'rgba(34, 197, 94, 0.15)',
    textColor: '#22C55E',
  },
  moderate: {
    label: 'weather.risk.moderate',
    icon: 'alert' as const,
    bgColor: 'rgba(245, 158, 11, 0.15)',
    textColor: '#F59E0B',
  },
  high: {
    label: 'weather.risk.high',
    icon: 'alert' as const,
    bgColor: 'rgba(234, 88, 12, 0.15)',
    textColor: '#EA580C',
  },
  extreme: {
    label: 'weather.risk.extreme',
    icon: 'storm' as const,
    bgColor: 'rgba(220, 38, 38, 0.15)',
    textColor: '#DC2626',
  },
};

export function RouteRiskBadge({ risk, compact = false }: RouteRiskBadgeProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const config = RISK_CONFIG[risk];

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: config.bgColor }]}>
        <Icon name={config.icon} size={14} color={config.textColor} />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Icon name={config.icon} size={16} color={config.textColor} />
      <Text style={[styles.label, { color: config.textColor }]}>
        {t(config.label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  compactBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 12,
  },
});
