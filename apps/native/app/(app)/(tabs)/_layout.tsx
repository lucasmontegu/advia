// apps/native/app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon, type IconName } from '@/components/icons';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const colors = useThemeColors();
  return (
    <Icon
      name={name}
      size={24}
      color={focused ? colors.primary : colors.mutedForeground}
    />
  );
}

export default function TabLayout() {
  const colors = useThemeColors();

  return (
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
            <TabIcon name="map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rutas',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="route" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="user" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
