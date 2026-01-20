// apps/native/components/alert-banner.tsx
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface AlertBannerProps {
  alert?: {
    type: string;
    severity: 'extreme' | 'severe' | 'moderate' | 'minor';
    distance?: string;
  };
}

export function AlertBanner({ alert }: AlertBannerProps) {
  const colors = useThemeColors();

  // Por ahora mostrar un alert de ejemplo si no hay ninguno
  if (!alert) {
    return null;
  }

  const severityColors = {
    extreme: colors.alert.extreme,
    severe: colors.alert.severe,
    moderate: colors.alert.moderate,
    minor: colors.alert.minor,
  };

  const severityLabels = {
    extreme: 'Alerta extrema',
    severe: 'Alerta severa',
    moderate: 'Alerta moderada',
    minor: 'Alerta menor',
  };

  return (
    <Pressable
      style={{
        backgroundColor: severityColors[alert.severity],
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 14,
            color: '#FFFFFF',
          }}
        >
          {severityLabels[alert.severity]}
        </Text>
        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 12,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {alert.type} {alert.distance && `a ${alert.distance}`}
        </Text>
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 16 }}>→</Text>
    </Pressable>
  );
}
