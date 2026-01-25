// apps/native/app/(app)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
	const colors = useThemeColors();
	return (
		<Icon
			name={name}
			size={22}
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
					borderTopWidth: 0,
					height: 56,
					paddingBottom: 8,
					paddingTop: 6,
					elevation: 0,
					shadowOpacity: 0,
				},
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.mutedForeground,
				tabBarLabelStyle: {
					fontFamily: "Inter_600SemiBold",
					fontSize: 10,
					marginTop: -2,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Mapa",
					tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
				}}
			/>
			<Tabs.Screen
				name="routes"
				options={{
					title: "Rutas",
					tabBarIcon: ({ focused }) => (
						<TabIcon name="route" focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Perfil",
					tabBarIcon: ({ focused }) => (
						<TabIcon name="user" focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}
