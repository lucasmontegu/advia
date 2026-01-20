// apps/native/app/(auth)/verify.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import * as Linking from 'expo-linking';

export default function VerifyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();

  const handleOpenEmail = async () => {
    await Linking.openURL('mailto:');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 justify-center items-center px-8">
        {/* Icon */}
        <View style={{ marginBottom: 24 }}>
          <Icon name="mail" size={64} color={colors.primary} />
        </View>

        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 24,
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {t('auth.checkEmail')}
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 16,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: 8,
            lineHeight: 24,
          }}
        >
          {t('auth.magicLinkSent')}
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 16,
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          {email}
        </Text>

        <Button
          onPress={handleOpenEmail}
          variant="secondary"
          size="lg"
          className="w-full mb-4"
        >
          <Button.Label>{t('auth.openEmailApp')}</Button.Label>
        </Button>

        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: 'NunitoSans_400Regular',
            }}
          >
            {t('auth.useAnotherEmail')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
