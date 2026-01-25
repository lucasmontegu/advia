import { Stack } from "expo-router";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function SubscriptionLayout() {
	const colors = useThemeColors();

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="success" />
		</Stack>
	);
}
