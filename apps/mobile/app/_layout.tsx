// apps/native/app/_layout.tsx
import '@/global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_100Thin,
  Inter_300Light,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { AppThemeProvider } from '@/contexts/app-theme-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { RevenueCatProvider } from '@/providers/revenuecat-provider';
import { setupI18n, I18nextProvider, getI18nInstance } from '@/lib/i18n';
import { queryClient, asyncStoragePersister } from '@/lib/query-client';
import { initAnalytics } from '@/lib/analytics';

// Initialize i18n before app renders (synchronous with initImmediate: false)
setupI18n();

// Initialize analytics
initAnalytics();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function Layout() {
const [loaded, error] = useFonts({
    Inter_100Thin,
    Inter_400Regular,
    Inter_300Light,
    Inter_600SemiBold,
  });
  

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={getI18nInstance()}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <KeyboardProvider>
            <AppThemeProvider>
              <HeroUINativeProvider>
                <RevenueCatProvider>
                  <NotificationsProvider>
                    <StackLayout />
                  </NotificationsProvider>
                </RevenueCatProvider>
              </HeroUINativeProvider>
            </AppThemeProvider>
          </KeyboardProvider>
        </PersistQueryClientProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
