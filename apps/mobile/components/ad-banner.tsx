// apps/native/components/ad-banner.tsx
import { Text, View } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTrialStore } from "@/stores/trial-store";

export function AdBanner() {
	const colors = useThemeColors();
	const { isPremium } = useTrialStore();

	if (isPremium) return null;

	return (
		<View
			style={{
				height: 50,
				backgroundColor: colors.muted,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
				Ad Banner Placeholder
			</Text>
		</View>
	);
}
