// apps/native/app/(app)/_layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTrialStore } from '@/stores/trial-store';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function AppLayout() {
  const router = useRouter();
  const colors = useThemeColors();
  const { trialStartDate, checkTrialStatus, isPremium } = useTrialStore();

  useEffect(() => {
    // Si no hay trial ni premium, redirigir a welcome
    if (!trialStartDate && !isPremium) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Verificar si el trial sigue activo
    const isActive = checkTrialStatus();
    if (!isActive && !isPremium) {
      // Trial expirado, mostrar paywall o sign-in
      router.replace('/(auth)/sign-in');
    }
  }, [trialStartDate, isPremium]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="premium"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="route-detail"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="login-incentive"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
