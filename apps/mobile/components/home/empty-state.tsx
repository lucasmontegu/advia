// apps/mobile/components/home/empty-state.tsx

import { Button } from "heroui-native";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

type EmptyStateProps = {
	onPlanTrip: () => void;
};

export function EmptyState({ onPlanTrip }: EmptyStateProps) {
	const colors = useThemeColors();
	const { t } = useTranslation();

	return (
		<Animated.View
			entering={FadeInDown.duration(600)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* AI Avatar illustration */}
			<View style={styles.avatarContainer}>
				<View
					style={[
						styles.avatarOuter,
						{ backgroundColor: colors.primary + "15" },
					]}
				>
					<View
						style={[styles.avatarInner, { backgroundColor: colors.primary }]}
					>
						<Icon name="storm" size={32} color="#FFFFFF" />
					</View>
				</View>

				{/* Waving hand emoji */}
				<View style={styles.waveEmoji}>
					<Text style={styles.emojiText}>👋</Text>
				</View>
			</View>

			{/* Greeting text */}
			<Text style={[styles.greeting, { color: colors.foreground }]}>
				{t("aiCopilot.greeting")}
			</Text>

			{/* CTA Button */}
			<Button onPress={onPlanTrip} size="lg" className="mt-4 w-full">
				<Button.Label>{t("aiCopilot.planFirstTrip")}</Button.Label>
			</Button>

			{/* Feature hints */}
			<View style={styles.hintsContainer}>
				<FeatureHint
					icon="voice"
					text="Voice commands supported"
					colors={colors}
				/>
				<FeatureHint
					icon="notification"
					text="Real-time weather alerts"
					colors={colors}
				/>
			</View>
		</Animated.View>
	);
}

type FeatureHintProps = {
	icon: "voice" | "notification";
	text: string;
	colors: ReturnType<typeof useThemeColors>;
};

function FeatureHint({ icon, text, colors }: FeatureHintProps) {
	return (
		<View style={styles.hintRow}>
			<Icon name={icon} size={14} color={colors.mutedForeground} />
			<Text style={[styles.hintText, { color: colors.mutedForeground }]}>
				{text}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 16,
		padding: 24,
		borderRadius: 20,
		alignItems: "center",
	},
	avatarContainer: {
		marginBottom: 20,
		position: "relative",
	},
	avatarOuter: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarInner: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: "center",
		alignItems: "center",
	},
	waveEmoji: {
		position: "absolute",
		top: -5,
		right: -5,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	emojiText: {
		fontSize: 20,
	},
	greeting: {
		fontFamily: "Inter_500Medium",
		fontSize: 16,
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 8,
	},
	hintsContainer: {
		marginTop: 20,
		gap: 8,
	},
	hintRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	hintText: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
});
