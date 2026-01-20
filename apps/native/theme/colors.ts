// apps/native/theme/colors.ts
export const colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#171717',
    card: '#FFFFFF',
    cardForeground: '#171717',
    primary: '#4338CA',
    primaryForeground: '#EEF2FF',
    secondary: '#F5F5F5',
    secondaryForeground: '#2E2E2E',
    muted: '#F5F5F5',
    mutedForeground: '#737373',
    destructive: '#DC2626',
    border: '#E5E5E5',
    input: '#E5E5E5',
  },
  dark: {
    background: '#171717',
    foreground: '#FAFAFA',
    card: '#262626',
    cardForeground: '#FAFAFA',
    primary: '#4F46E5',
    primaryForeground: '#EEF2FF',
    secondary: '#3A3A3A',
    secondaryForeground: '#FAFAFA',
    muted: '#3A3A3A',
    mutedForeground: '#A3A3A3',
    destructive: '#EF4444',
    border: 'rgba(255,255,255,0.1)',
    input: 'rgba(255,255,255,0.15)',
  },
  // Colores compartidos (no cambian con theme)
  alert: {
    extreme: '#DC2626',
    severe: '#EA580C',
    moderate: '#F59E0B',
    minor: '#22C55E',
  },
  safe: '#10B981',
} as const;

export type ThemeColors = typeof colors.light;
export type AlertColors = typeof colors.alert;
