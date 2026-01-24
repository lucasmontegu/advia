// apps/native/app/(app)/login-incentive.tsx
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { authClient } from '@/lib/auth-client';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useState, useEffect, useRef } from 'react';
import { useTrialStore } from '@/stores/trial-store';
import { Analytics, identifyUser } from '@/lib/analytics';
import { queryClient } from '@/lib/query-client';

export default function LoginIncentiveModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);
  const { startTrial, trialStartDate } = useTrialStore();
  const { data: session } = authClient.useSession();
  const pendingAuthMethod = useRef<'google' | 'apple' | null>(null);
  const hasHandledAuth = useRef(false);

  // Handle successful OAuth authentication
  useEffect(() => {
    if (session?.user && pendingAuthMethod.current && !hasHandledAuth.current) {
      hasHandledAuth.current = true;
      const method = pendingAuthMethod.current;

      // Start trial for new users
      const isNewUser = !trialStartDate;
      if (isNewUser) {
        startTrial();
        Analytics.signUp(method);
      } else {
        Analytics.signIn(method);
      }

      // Identify user for analytics
      identifyUser(session.user.id, {
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      });

      // Invalidate queries and close modal
      queryClient.invalidateQueries().then(() => {
        router.back();
      });
    }
  }, [session, trialStartDate, startTrial, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    pendingAuthMethod.current = 'google';
    hasHandledAuth.current = false;
    try {
      await authClient.signIn.social({ provider: 'google' });
      // The useEffect above will handle the rest when session updates
    } catch (error) {
      console.error('Google sign-in error:', error);
      pendingAuthMethod.current = null;
    } finally {
      setIsLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading('apple');
    pendingAuthMethod.current = 'apple';
    hasHandledAuth.current = false;
    try {
      await authClient.signIn.social({ provider: 'apple' });
      // The useEffect above will handle the rest when session updates
    } catch (error) {
      console.error('Apple sign-in error:', error);
      pendingAuthMethod.current = null;
    } finally {
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    router.push('/(auth)/email-input');
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 24 }}>
        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-end', padding: 8 }}
        >
          <Icon name="close" size={24} color={colors.mutedForeground} />
        </Pressable>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Icon */}
          <View style={{ marginBottom: 24 }}>
            <Icon name="lock" size={64} color={colors.primary} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'NunitoSans_700Bold',
              fontSize: 24,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {t('loginIncentive.title')}
          </Text>

          <Text
            style={{
              fontFamily: 'NunitoSans_400Regular',
              fontSize: 16,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24,
              paddingHorizontal: 16,
            }}
          >
            {t('loginIncentive.subtitle')}
          </Text>

          {/* Auth buttons */}
          <View style={{ width: '100%', gap: 12 }}>
            <Button
              onPress={handleGoogleSignIn}
              variant="secondary"
              size="lg"
              isDisabled={isLoading !== null}
            >
              <Button.Label>
                {isLoading === 'google' ? t('auth.connecting') : t('auth.continueWithGoogle')}
              </Button.Label>
            </Button>

            <Button
              onPress={handleAppleSignIn}
              variant="secondary"
              size="lg"
              isDisabled={isLoading !== null}
            >
              <Button.Label>
                {isLoading === 'apple' ? t('auth.connecting') : t('auth.continueWithApple')}
              </Button.Label>
            </Button>

            <Button onPress={handleEmailSignIn} variant="ghost" size="lg">
              <Button.Label>{t('auth.continueWithEmail')}</Button.Label>
            </Button>
          </View>
        </View>

        {/* Skip option */}
        <Pressable
          onPress={handleSkip}
          style={{ alignItems: 'center', paddingVertical: 16 }}
        >
          <Text
            style={{
              fontFamily: 'NunitoSans_400Regular',
              color: colors.mutedForeground,
            }}
          >
            {t('loginIncentive.continueWithoutAccount')}
          </Text>
          <Text
            style={{
              fontFamily: 'NunitoSans_400Regular',
              color: colors.mutedForeground,
              fontSize: 12,
            }}
          >
            {t('loginIncentive.localDataOnly')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
