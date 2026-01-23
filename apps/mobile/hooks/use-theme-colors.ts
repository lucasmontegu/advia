// apps/mobile/hooks/use-theme-colors.ts
import { useMemo } from 'react';
import { useAppTheme } from '@/contexts/app-theme-context';
import { colors, type ThemeColors } from '@/theme/colors';

type UseThemeColorsReturn = ThemeColors & { alert: typeof colors.alert };

export function useThemeColors(): UseThemeColorsReturn {
  const { isDark } = useAppTheme();

  return useMemo(() => ({
    // Theme-specific colors (includes safe, caution, warning, danger per theme)
    ...(isDark ? colors.dark : colors.light),
    // Shared alert severity colors
    alert: colors.alert,
  }) as UseThemeColorsReturn, [isDark]);
}
