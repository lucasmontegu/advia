// apps/native/app/(auth)/sign-in.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { authClient } from '@/lib/auth-client';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    try {
      await authClient.signIn.social({ provider: 'google' });
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading('apple');
    try {
      await authClient.signIn.social({ provider: 'apple' });
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('Apple sign-in error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    router.push('/(auth)/email-input');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-6 pt-4">
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="mb-8"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Icon name="arrowLeft" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 16 }}>{t('auth.back')}</Text>
        </Pressable>

        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          {t('auth.signInTitle')}
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 16,
            color: colors.mutedForeground,
            marginBottom: 32,
            lineHeight: 24,
          }}
        >
          {t('auth.signInSubtitle')}
        </Text>

        {/* Social buttons */}
        <View className="gap-3">
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
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text
            style={{
              marginHorizontal: 16,
              color: colors.mutedForeground,
              fontFamily: 'NunitoSans_400Regular',
            }}
          >
            {t('common.or')}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        {/* Email option */}
        <Button onPress={handleEmailSignIn} variant="ghost" size="lg">
          <Button.Label>{t('auth.continueWithEmail')}</Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
