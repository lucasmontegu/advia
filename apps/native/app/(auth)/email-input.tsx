// apps/native/app/(auth)/email-input.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextField } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { authClient } from '@/lib/auth-client';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';

export default function EmailInputScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setError(t('auth.enterEmailError'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: '/(app)/(tabs)',
      });
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim() },
      });
    } catch (err) {
      setError(t('auth.sendError'));
    } finally {
      setIsLoading(false);
    }
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
          {t('auth.enterEmail')}
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

        {/* Email input */}
        <TextField className="mb-4">
          <TextField.Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
          />
        </TextField>

        {error && (
          <Text
            style={{
              color: colors.destructive,
              marginBottom: 16,
              fontFamily: 'NunitoSans_400Regular',
            }}
          >
            {error}
          </Text>
        )}

        <Button onPress={handleSendMagicLink} size="lg" isDisabled={isLoading}>
          <Button.Label>
            {isLoading ? t('auth.sending') : t('auth.sendMagicLink')}
          </Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
