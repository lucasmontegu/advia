// apps/native/app/(app)/(tabs)/index.tsx
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { MapViewComponent } from '@/components/map-view';
import { ChatBottomSheet } from '@/components/chat-bottom-sheet';
import { AlertBanner } from '@/components/alert-banner';
import { AdBanner } from '@/components/ad-banner';
import { Icon } from '@/components/icons';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function MapScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [alerts] = useState([]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.card }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'NunitoSans_700Bold',
              fontSize: 20,
              color: colors.foreground,
            }}
          >
            Advia
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="location" size={16} color={colors.mutedForeground} />
            <Text
              style={{
                fontFamily: 'NunitoSans_400Regular',
                fontSize: 14,
                color: colors.mutedForeground,
              }}
            >
              {t('map.myZone')}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Ad Banner - now below header */}
      <AdBanner />

      {/* Alert Banner (si hay alertas activas) */}
      <AlertBanner />

      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapViewComponent alerts={alerts} />
      </View>

      {/* Chat Bottom Sheet */}
      <ChatBottomSheet />
    </View>
  );
}
