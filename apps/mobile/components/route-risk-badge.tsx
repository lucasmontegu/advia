// apps/mobile/components/route-risk-badge.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RoadRisk } from "@/hooks/use-route-weather";
import { getRiskDescription, RISK_COLORS } from "@/hooks/use-route-weather";

type RouteRiskBadgeProps = {
	risk: RoadRisk;
	/** Optional callback when badge is pressed */
	onPress?: () => void;
	/** Size variant */
	size?: "small" | "medium" | "large";
	/** Show description text */
	showDescription?: boolean;
};

const RISK_EMOJIS: Record<RoadRisk, string> = {
	low: "✅",
	moderate: "⚠️",
	high: "🟠",
	extreme: "🛑",
};

const RISK_LABELS: Record<RoadRisk, string> = {
	low: "Seguro",
	moderate: "Precaución",
	high: "Riesgo Alto",
	extreme: "Peligroso",
};

export function RouteRiskBadge({
	risk,
	onPress,
	size = "medium",
	showDescription = false,
}: RouteRiskBadgeProps) {
	const sizeStyles = SIZE_STYLES[size];
	const color = RISK_COLORS[risk];
	const emoji = RISK_EMOJIS[risk];
	const label = RISK_LABELS[risk];
	const description = getRiskDescription(risk);

	const content = (
		<View
			style={[styles.container, sizeStyles.container, { borderColor: color }]}
		>
			<View style={[styles.iconContainer, { backgroundColor: color }]}>
				<Text style={[styles.emoji, sizeStyles.emoji]}>{emoji}</Text>
			</View>
			<View style={styles.textContainer}>
				<Text style={[styles.label, sizeStyles.label]}>{label}</Text>
				{showDescription && (
					<Text style={[styles.description, sizeStyles.description]}>
						{description}
					</Text>
				)}
			</View>
		</View>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => [pressed && styles.pressed]}
			>
				{content}
			</Pressable>
		);
	}

	return content;
}

const SIZE_STYLES = {
	small: StyleSheet.create({
		container: {
			paddingVertical: 4,
			paddingHorizontal: 8,
			borderRadius: 8,
		},
		emoji: {
			fontSize: 14,
		},
		label: {
			fontSize: 12,
		},
		description: {
			fontSize: 10,
		},
	}),
	medium: StyleSheet.create({
		container: {
			paddingVertical: 8,
			paddingHorizontal: 12,
			borderRadius: 12,
		},
		emoji: {
			fontSize: 18,
		},
		label: {
			fontSize: 14,
		},
		description: {
			fontSize: 12,
		},
	}),
	large: StyleSheet.create({
		container: {
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderRadius: 16,
		},
		emoji: {
			fontSize: 24,
		},
		label: {
			fontSize: 18,
			fontWeight: "600",
		},
		description: {
			fontSize: 14,
		},
	}),
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1f2937",
		borderWidth: 2,
		gap: 8,
	},
	iconContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		flex: 1,
	},
	emoji: {
		textAlign: "center",
	},
	label: {
		color: "#ffffff",
		fontWeight: "500",
	},
	description: {
		color: "#9ca3af",
		marginTop: 2,
	},
	pressed: {
		opacity: 0.8,
	},
});

/**
 * Compact version for inline display
 */
export function RouteRiskChip({ risk }: { risk: RoadRisk }) {
	const color = RISK_COLORS[risk];
	const emoji = RISK_EMOJIS[risk];
	const label = RISK_LABELS[risk];

	return (
		<View
			style={[
				chipStyles.container,
				{ backgroundColor: color + "20", borderColor: color },
			]}
		>
			<Text style={chipStyles.emoji}>{emoji}</Text>
			<Text style={[chipStyles.label, { color }]}>{label}</Text>
		</View>
	);
}

const chipStyles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 12,
		borderWidth: 1,
		gap: 4,
	},
	emoji: {
		fontSize: 12,
	},
	label: {
		fontSize: 12,
		fontWeight: "500",
	},
});
