// apps/mobile/components/ai-chat/alert-message-card.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type AlertSeverity = "minor" | "moderate" | "severe" | "extreme";

export type AlertMessageData = {
	id: string;
	type: string;
	severity: AlertSeverity;
	title: string;
	description: string;
	location?: string;
	kmRange?: string;
	actionable?: boolean;
};

type AlertMessageCardProps = {
	alert: AlertMessageData;
	onAddStop?: () => void;
	onIgnore?: () => void;
	onViewDetails?: () => void;
};

const SEVERITY_STYLES: Record<
	AlertSeverity,
	{ bg: string; border: string; text: string; icon: IconName }
> = {
	minor: {
		bg: "rgba(34, 197, 94, 0.1)",
		border: "#22c55e",
		text: "#16a34a",
		icon: "info",
	},
	moderate: {
		bg: "rgba(234, 179, 8, 0.1)",
		border: "#eab308",
		text: "#ca8a04",
		icon: "alert",
	},
	severe: {
		bg: "rgba(249, 115, 22, 0.1)",
		border: "#f97316",
		text: "#ea580c",
		icon: "alert",
	},
	extreme: {
		bg: "rgba(220, 38, 38, 0.1)",
		border: "#dc2626",
		text: "#dc2626",
		icon: "warning",
	},
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlertMessageCard({
	alert,
	onAddStop,
	onIgnore,
	onViewDetails,
}: AlertMessageCardProps) {
	const colors = useThemeColors();
	const severityStyle = SEVERITY_STYLES[alert.severity];

	return (
		<Animated.View
			entering={FadeInUp.duration(300).springify()}
			style={[
				styles.container,
				{
					backgroundColor: severityStyle.bg,
					borderColor: severityStyle.border,
				},
			]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: severityStyle.border + "20" },
					]}
				>
					<Icon
						name={severityStyle.icon}
						size={18}
						color={severityStyle.border}
					/>
				</View>
				<View style={styles.headerText}>
					<Text style={[styles.title, { color: severityStyle.text }]}>
						{alert.title}
					</Text>
					{alert.kmRange && (
						<Text style={[styles.location, { color: colors.mutedForeground }]}>
							{alert.kmRange}
						</Text>
					)}
				</View>
			</View>

			{/* Description */}
			<Text style={[styles.description, { color: colors.foreground }]}>
				{alert.description}
			</Text>

			{/* Location info */}
			{alert.location && (
				<View style={styles.locationRow}>
					<Icon name="location" size={12} color={colors.mutedForeground} />
					<Text
						style={[styles.locationText, { color: colors.mutedForeground }]}
					>
						{alert.location}
					</Text>
				</View>
			)}

			{/* Actions */}
			{alert.actionable && (
				<View style={styles.actions}>
					{onAddStop && (
						<ActionButton
							label="Add Safe Stop"
							variant="primary"
							severityColor={severityStyle.border}
							onPress={onAddStop}
						/>
					)}
					{onIgnore && (
						<ActionButton
							label="Continue Anyway"
							variant="secondary"
							onPress={onIgnore}
						/>
					)}
					{onViewDetails && (
						<ActionButton
							label="Details"
							variant="text"
							onPress={onViewDetails}
						/>
					)}
				</View>
			)}
		</Animated.View>
	);
}

function ActionButton({
	label,
	variant,
	severityColor,
	onPress,
}: {
	label: string;
	variant: "primary" | "secondary" | "text";
	severityColor?: string;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);

	const handlePressIn = () => {
		scale.value = withSpring(0.96);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const getButtonStyle = () => {
		switch (variant) {
			case "primary":
				return {
					backgroundColor: severityColor || colors.primary,
					paddingVertical: 10,
					paddingHorizontal: 14,
				};
			case "secondary":
				return {
					backgroundColor: colors.muted,
					paddingVertical: 10,
					paddingHorizontal: 14,
				};
			case "text":
				return {
					backgroundColor: "transparent",
					paddingVertical: 8,
					paddingHorizontal: 10,
				};
		}
	};

	const getTextColor = () => {
		switch (variant) {
			case "primary":
				return "#fff";
			case "secondary":
				return colors.foreground;
			case "text":
				return colors.mutedForeground;
		}
	};

	return (
		<AnimatedPressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[styles.actionButton, getButtonStyle(), animatedStyle]}
			accessibilityRole="button"
			accessibilityLabel={label}
		>
			<Text style={[styles.actionButtonText, { color: getTextColor() }]}>
				{label}
			</Text>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 14,
		borderWidth: 1,
		padding: 14,
		marginVertical: 4,
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
		marginBottom: 10,
	},
	iconContainer: {
		width: 32,
		height: 32,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
	},
	location: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginTop: 2,
	},
	description: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
		lineHeight: 19,
		marginBottom: 10,
	},
	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 12,
	},
	locationText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	actions: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	actionButton: {
		borderRadius: 8,
	},
	actionButtonText: {
		fontFamily: "Inter_500Medium",
		fontSize: 12,
	},
});
