// apps/mobile/app/(auth)/_layout.tsx
import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { isNewOnboardingComplete } from '@/components/onboarding';

export default function AuthLayout() {
  const colors = useThemeColors();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once on mount to prevent race conditions
    if (hasChecked.current) return;
    hasChecked.current = true;

    let isMounted = true;

    const checkOnboarding = async () => {
      try {
        const completed = await isNewOnboardingComplete();

        if (isMounted && !completed) {
          router.replace('/(auth)/onboarding');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // On error, proceed to normal auth flow
      } finally {
        if (isMounted) {
          setIsCheckingOnboarding(false);
        }
      }
    };

    checkOnboarding();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Don't render anything while checking onboarding status to prevent flash
  if (isCheckingOnboarding) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="email-input" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
