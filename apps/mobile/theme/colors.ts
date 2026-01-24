// apps/mobile/theme/colors.ts
// Design tokens for Driwet v2.0 Chat-First Experience
// Reference: docs/plans/2025-01-23-ux-redesign-chat-first.md

export const colors = {
  light: {
    // Base
    background: '#FAFAFA',
    foreground: '#171717',
    // Surface levels
    card: '#FFFFFF',
    cardForeground: '#171717',
    surface: '#FFFFFF',
    surfaceElevated: '#F5F5F5',
    // Brand
    primary: '#4F46E5',
    primaryForeground: '#FFFFFF',
    // Secondary
    secondary: '#F5F5F5',
    secondaryForeground: '#525252',
    // Muted
    muted: '#F5F5F5',
    mutedForeground: '#525252',
    // Destructive
    destructive: '#EF4444',
    // Borders
    border: '#E5E5E5',
    input: '#E5E5E5',
    // Semantic - weather/risk
    safe: '#10B981',
    caution: '#F59E0B',
    warning: '#F97316',
    danger: '#EF4444',
  },
  dark: {
    // Base - deeper black for OLED
    background: '#0A0A0A',
    foreground: '#FAFAFA',
    // Surface levels
    card: '#171717',
    cardForeground: '#FAFAFA',
    surface: '#171717',
    surfaceElevated: '#262626',
    // Brand - lighter for dark mode
    primary: '#818CF8',
    primaryForeground: '#0A0A0A',
    // Secondary
    secondary: '#262626',
    secondaryForeground: '#FAFAFA',
    // Muted
    muted: '#262626',
    mutedForeground: '#A3A3A3',
    // Destructive
    destructive: '#F87171',
    // Borders
    border: 'rgba(255,255,255,0.1)',
    input: 'rgba(255,255,255,0.15)',
    // Semantic - weather/risk (brighter for dark mode)
    safe: '#34D399',
    caution: '#FBBF24',
    warning: '#FB923C',
    danger: '#F87171',
  },
  // Alert severity levels (consistent across themes)
  alert: {
    extreme: '#DC2626',
    severe: '#EA580C',
    moderate: '#F59E0B',
    minor: '#22C55E',
  },
  // Safety status colors (used for Safety Status Card)
  safety: {
    safe: {
      bg: '#ECFDF5',
      bgDark: '#064E3B',
      text: '#065F46',
      textDark: '#6EE7B7',
      icon: '#10B981',
    },
    caution: {
      bg: '#FFFBEB',
      bgDark: '#78350F',
      text: '#92400E',
      textDark: '#FDE68A',
      icon: '#F59E0B',
    },
    warning: {
      bg: '#FFF7ED',
      bgDark: '#7C2D12',
      text: '#9A3412',
      textDark: '#FDBA74',
      icon: '#F97316',
    },
    danger: {
      bg: '#FEF2F2',
      bgDark: '#7F1D1D',
      text: '#991B1B',
      textDark: '#FCA5A5',
      icon: '#EF4444',
    },
  },
  // Legacy shared colors (for backwards compatibility)
  safe: '#10B981',
  warning: '#F59E0B',
} as const;

export type ThemeColors = typeof colors.light;
export type AlertColors = typeof colors.alert;
export type ThemeMode = 'light' | 'dark' | 'auto';

// Time-based theme switching
export function getAutoTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  // Dark mode: 7 PM (19:00) to 6 AM (06:00)
  return hour >= 19 || hour < 6 ? 'dark' : 'light';
}
