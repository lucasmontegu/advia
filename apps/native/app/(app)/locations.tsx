// apps/native/app/(app)/locations.tsx
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import { useLocations, useDeleteLocation, useSetPrimaryLocation } from '@/hooks/use-api';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function LocationsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { requireAuth } = useRequireAuth();

  const { data: locations, isLoading } = useLocations();
  const deleteLocation = useDeleteLocation();
  const setPrimaryLocation = useSetPrimaryLocation();

  const handleAddLocation = () => {
    requireAuth(() => {
      router.push("/(app)/add-location");
    });
  };

  const handleSetPrimary = (id: string) => {
    setPrimaryLocation.mutate(id);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      t('locations.deleteConfirm'),
      t('locations.deleteDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteLocation.mutate(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Icon name="arrowLeft" size={24} color={colors.foreground} />
        </Pressable>
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 20,
            color: colors.foreground,
            flex: 1,
          }}
        >
          {t('locations.title')}
        </Text>
        <Pressable onPress={handleAddLocation}>
          <Icon name="location" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : !locations || locations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Icon name="location" size={64} color={colors.mutedForeground} />
            <Text
              style={{
                fontFamily: 'NunitoSans_600SemiBold',
                fontSize: 18,
                color: colors.foreground,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {t('locations.empty')}
            </Text>
            <Text
              style={{
                fontFamily: 'NunitoSans_400Regular',
                fontSize: 14,
                color: colors.mutedForeground,
                marginTop: 8,
                textAlign: 'center',
                paddingHorizontal: 32,
              }}
            >
              {t('locations.emptySubtitle')}
            </Text>
            <Pressable
              onPress={handleAddLocation}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 24,
              }}
            >
              <Text
                style={{
                  fontFamily: 'NunitoSans_600SemiBold',
                  color: colors.primaryForeground,
                }}
              >
                {t('locations.addNew')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {locations.map((location) => (
              <View
                key={location.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: location.isPrimary ? colors.primary : colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon
                    name="location"
                    size={20}
                    color={location.isPrimary ? colors.primary : colors.foreground}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          fontFamily: 'NunitoSans_600SemiBold',
                          fontSize: 16,
                          color: colors.foreground,
                        }}
                      >
                        {location.name}
                      </Text>
                      {location.isPrimary && (
                        <View
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'NunitoSans_600SemiBold',
                              fontSize: 10,
                              color: colors.primaryForeground,
                            }}
                          >
                            {t('locations.primary')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: 'NunitoSans_400Regular',
                        fontSize: 12,
                        color: colors.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      {location.notifyAlerts ? t('locations.alerts') : t('locations.noAlerts')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(location.id, location.name)}
                    style={{ padding: 8 }}
                  >
                    <Icon name="close" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                {!location.isPrimary && (
                  <Pressable
                    onPress={() => handleSetPrimary(location.id)}
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'NunitoSans_400Regular',
                        fontSize: 14,
                        color: colors.primary,
                      }}
                    >
                      {t('locations.setPrimary')}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
