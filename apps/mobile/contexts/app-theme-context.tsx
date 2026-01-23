import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Uniwind, useUniwind } from "uniwind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAutoTheme, type ThemeMode } from "@/theme/colors";

type ThemeName = "light" | "dark";

type AppThemeContextType = {
  currentTheme: string;
  themeMode: ThemeMode;
  isLight: boolean;
  isDark: boolean;
  isAuto: boolean;
  setTheme: (theme: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const THEME_MODE_KEY = "@driwet/theme-mode";
const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useUniwind();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme mode on mount
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "auto")) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error("Failed to load theme mode:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadThemeMode();
  }, []);

  // Apply theme based on mode
  useEffect(() => {
    if (!isInitialized) return;

    if (themeMode === "auto") {
      const autoTheme = getAutoTheme();
      Uniwind.setTheme(autoTheme);
    } else {
      Uniwind.setTheme(themeMode);
    }
  }, [themeMode, isInitialized]);

  // Auto-update theme every minute when in auto mode (for sunrise/sunset transitions)
  useEffect(() => {
    if (themeMode !== "auto") return;

    const interval = setInterval(() => {
      const autoTheme = getAutoTheme();
      if (theme !== autoTheme) {
        Uniwind.setTheme(autoTheme);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [themeMode, theme]);

  const isLight = useMemo(() => theme === "light", [theme]);
  const isDark = useMemo(() => theme === "dark", [theme]);
  const isAuto = useMemo(() => themeMode === "auto", [themeMode]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeModeState(newTheme);
    AsyncStorage.setItem(THEME_MODE_KEY, newTheme).catch(console.error);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_MODE_KEY, mode).catch(console.error);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setThemeModeState(newTheme);
    AsyncStorage.setItem(THEME_MODE_KEY, newTheme).catch(console.error);
  }, [theme]);

  const value = useMemo(
    () => ({
      currentTheme: theme,
      themeMode,
      isLight,
      isDark,
      isAuto,
      setTheme,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isLight, isDark, isAuto, setTheme, setThemeMode, toggleTheme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};

// Default values for when context is not yet available (during Suspense)
const defaultThemeContext: AppThemeContextType = {
  currentTheme: "light",
  themeMode: "auto",
  isLight: true,
  isDark: false,
  isAuto: true,
  setTheme: () => {},
  setThemeMode: () => {},
  toggleTheme: () => {},
};

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  // Return default values during Suspense/initial render instead of throwing
  // This handles expo-router's Suspense boundary gracefully
  return context ?? defaultThemeContext;
}
