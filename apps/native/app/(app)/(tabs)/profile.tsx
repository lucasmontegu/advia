// apps/native/app/(app)/(tabs)/profile.tsx
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';
import { authClient } from '@/lib/auth-client';
import { Icon, type IconName } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';

type StatItem = {
  icon: IconName;
  labelKey: string;
  value: string | number;
};

type SettingItem = {
  icon: IconName;
  labelKey: string;
  route: string | null;
  valueKey?: string;
};

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { isPremium, getRemainingDays } = useTrialStore();
  const remainingDays = getRemainingDays();

  // TODO: Replace with real data from API
  const stats: StatItem[] = [
    { icon: 'storm', labelKey: 'profile.stormsAvoided', value: 12 },
    { icon: 'money', labelKey: 'profile.moneySaved', value: '2,400' },
    { icon: 'road', labelKey: 'profile.kmTraveled', value: 847 },
  ];

  const settings: SettingItem[] = [
    { icon: 'notification', labelKey: 'profile.notifications', route: '/notifications' },
    { icon: 'location', labelKey: 'profile.savedLocations', route: '/locations' },
    { icon: 'theme', labelKey: 'profile.theme', route: null, valueKey: 'profile.themeAuto' },
    { icon: 'language', labelKey: 'profile.language', route: null, valueKey: 'profile.languageSpanish' },
    { icon: 'help', labelKey: 'profile.help', route: '/help' },
  ];

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace('/(auth)/welcome');
  };

  const handleUpgrade = () => {
    router.push('/(app)/premium');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 24,
          }}
        >
          {t('profile.title')}
        </Text>

        {/* User Card */}
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="user" size={24} color={colors.primaryForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'NunitoSans_600SemiBold',
                  color: colors.foreground,
                  fontSize: 16,
                }}
              >
                usuario@email.com
              </Text>
              <Text
                style={{
                  fontFamily: 'NunitoSans_400Regular',
                  color: isPremium ? colors.primary : colors.mutedForeground,
                  fontSize: 14,
                }}
              >
                {isPremium
                  ? t('profile.planPremium')
                  : t('profile.trialRemaining', { days: remainingDays })}
              </Text>
            </View>
            {!isPremium && (
              <Pressable onPress={handleUpgrade}>
                <Text style={{ color: colors.primary, fontFamily: 'NunitoSans_600SemiBold' }}>
                  {t('profile.upgrade')}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>

        {/* Stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="stats" size={18} color={colors.mutedForeground} />
          <Text
            style={{
              fontFamily: 'NunitoSans_600SemiBold',
              fontSize: 16,
              color: colors.mutedForeground,
            }}
          >
            {t('profile.stats')}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
            gap: 12,
          }}
        >
          {stats.map((stat, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name={stat.icon} size={20} color={colors.primary} />
              <Text
                style={{
                  fontFamily: 'NunitoSans_400Regular',
                  color: colors.foreground,
                }}
              >
                {t(stat.labelKey, { count: Number(stat.value), amount: stat.value, km: stat.value })}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="settings" size={18} color={colors.mutedForeground} />
          <Text
            style={{
              fontFamily: 'NunitoSans_600SemiBold',
              fontSize: 16,
              color: colors.mutedForeground,
            }}
          >
            {t('profile.settings')}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
          }}
        >
          {settings.map((setting, index) => (
            <Pressable
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: index < settings.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Icon name={setting.icon} size={20} color={colors.foreground} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontFamily: 'NunitoSans_400Regular',
                  color: colors.foreground,
                }}
              >
                {t(setting.labelKey)}
              </Text>
              {setting.valueKey && (
                <Text
                  style={{
                    fontFamily: 'NunitoSans_400Regular',
                    color: colors.mutedForeground,
                    marginRight: 8,
                  }}
                >
                  {t(setting.valueKey)}
                </Text>
              )}
              <Icon name="arrowRight" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
          }}
        >
          <Icon name="logout" size={20} color={colors.destructive} />
          <Text
            style={{
              fontFamily: 'NunitoSans_400Regular',
              color: colors.destructive,
            }}
          >
            {t('profile.logout')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
