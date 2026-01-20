// apps/native/app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';

// Tab icons (usando emojis temporalmente, reemplazar con Hugeicons)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🗺️',
    routes: '📍',
    profile: '👤',
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
      {icons[name]}
    </Text>
  );
}

export default function TabLayout() {
  const colors = useThemeColors();
  const { isPremium } = useTrialStore();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarLabelStyle: {
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="index" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Rutas',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="routes" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="profile" focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* Banner Ad placeholder - solo para usuarios free */}
      {!isPremium && (
        <View
          style={{
            height: 50,
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            Ad Banner Placeholder
          </Text>
        </View>
      )}
    </View>
  );
}
