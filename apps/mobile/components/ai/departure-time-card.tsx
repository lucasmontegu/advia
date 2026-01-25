// apps/mobile/components/ai/departure-time-card.tsx
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type DepartureOption = {
	time: string;
	displayTime: string;
	riskLevel: "safe" | "caution" | "warning" | "danger";
	riskScore: number;
	alerts: number;
	recommendation: string;
};

type DepartureTimeCardProps = {
	options: DepartureOption[];
	bestTime?: string;
	recommendation?: string;
	originName?: string;
	destName?: string;
	onSelectTime?: (option: DepartureOption) => void;
	onScheduleTrip?: (option: DepartureOption) => void;
};

const RISK_CONFIG = {
	safe: { color: "#10B981", label: "Seguro", icon: "checkCircle" as const },
	caution: { color: "#F59E0B", label: "Precaución", icon: "alert" as const },
	warning: { color: "#F97316", label: "Riesgo", icon: "warning" as const },
	danger: { color: "#EF4444", label: "Peligro", icon: "alert" as const },
};

function TimeOption({
	option,
	isSelected,
	isBest,
	onSelect,
	onSchedule,
}: {
	option: DepartureOption;
	isSelected: boolean;
	isBest: boolean;
	onSelect: () => void;
	onSchedule: () => void;
}) {
	const colors = useThemeColors();
	const config = RISK_CONFIG[option.riskLevel];

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			layout={Layout.springify()}
			style={[
				styles.optionCard,
				{ backgroundColor: isSelected ? config.color + "15" : colors.muted },
				isSelected && { borderColor: config.color, borderWidth: 2 },
			]}
		>
			<Pressable style={styles.optionContent} onPress={onSelect}>
				{/* Time and Best badge */}
				<View style={styles.optionHeader}>
					<View style={styles.timeContainer}>
						<Icon name="clock" size={18} color={config.color} />
						<Text style={[styles.timeText, { color: colors.foreground }]}>
							{option.displayTime}
						</Text>
					</View>
					{isBest && (
						<View style={[styles.bestBadge, { backgroundColor: config.color }]}>
							<Icon name="star" size={12} color="#FFFFFF" />
							<Text style={styles.bestText}>Recomendado</Text>
						</View>
					)}
				</View>

				{/* Risk indicator */}
				<View style={styles.riskRow}>
					<View
						style={[
							styles.riskIndicator,
							{ backgroundColor: config.color + "20" },
						]}
					>
						<Icon name={config.icon} size={14} color={config.color} />
						<Text style={[styles.riskLabel, { color: config.color }]}>
							{config.label}
						</Text>
					</View>
					{option.alerts > 0 && (
						<Text
							style={[styles.alertsText, { color: colors.mutedForeground }]}
						>
							{option.alerts} alerta{option.alerts > 1 ? "s" : ""}
						</Text>
					)}
				</View>

				{/* Recommendation */}
				<Text
					style={[styles.recommendation, { color: colors.mutedForeground }]}
				>
					{option.recommendation}
				</Text>

				{/* Schedule button */}
				{isSelected && (
					<Animated.View entering={FadeIn.duration(200)}>
						<Pressable
							style={[styles.scheduleButton, { backgroundColor: config.color }]}
							onPress={onSchedule}
						>
							<Icon name="clock" size={16} color="#FFFFFF" />
							<Text style={styles.scheduleButtonText}>Programar salida</Text>
						</Pressable>
					</Animated.View>
				)}
			</Pressable>
		</Animated.View>
	);
}

export function DepartureTimeCard({
	options,
	bestTime,
	recommendation,
	originName,
	destName,
	onSelectTime,
	onScheduleTrip,
}: DepartureTimeCardProps) {
	const colors = useThemeColors();
	const [selectedTime, setSelectedTime] = useState<string | null>(null);

	const handleSelect = useCallback(
		(option: DepartureOption) => {
			setSelectedTime(option.displayTime);
			onSelectTime?.(option);
		},
		[onSelectTime],
	);

	const handleSchedule = useCallback(
		(option: DepartureOption) => {
			onScheduleTrip?.(option);
		},
		[onScheduleTrip],
	);

	if (options.length === 0) {
		return (
			<Animated.View
				entering={FadeIn.duration(300)}
				exiting={FadeOut.duration(200)}
				style={[styles.container, { backgroundColor: colors.card }]}
			>
				<View style={styles.header}>
					<Icon name="clock" size={24} color={colors.warning} />
					<View style={styles.headerText}>
						<Text style={[styles.title, { color: colors.foreground }]}>
							Sin opciones disponibles
						</Text>
						<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
							Intenta con otro rango de horario
						</Text>
					</View>
				</View>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			exiting={FadeOut.duration(200)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<View
					style={[
						styles.headerIcon,
						{ backgroundColor: colors.primary + "20" },
					]}
				>
					<Icon name="clock" size={24} color={colors.primary} />
				</View>
				<View style={styles.headerText}>
					<Text style={[styles.title, { color: colors.foreground }]}>
						Mejor hora para salir
					</Text>
					{originName && destName && (
						<Text
							style={[styles.subtitle, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							{originName} → {destName}
						</Text>
					)}
				</View>
			</View>

			{/* Recommendation */}
			{recommendation && (
				<View
					style={[
						styles.recommendationBanner,
						{ backgroundColor: colors.primary + "10" },
					]}
				>
					<Icon name="star" size={16} color={colors.primary} />
					<Text
						style={[styles.recommendationText, { color: colors.foreground }]}
					>
						{recommendation}
					</Text>
				</View>
			)}

			{/* Time options */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.optionsScroll}
			>
				{options.map((option) => (
					<TimeOption
						key={option.time}
						option={option}
						isSelected={selectedTime === option.displayTime}
						isBest={option.displayTime === bestTime}
						onSelect={() => handleSelect(option)}
						onSchedule={() => handleSchedule(option)}
					/>
				))}
			</ScrollView>

			{/* Footer */}
			<Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
				Toca un horario para ver detalles · Desliza para ver más
			</Text>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	headerIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
		marginBottom: 2,
	},
	subtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
	recommendationBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		padding: 12,
		borderRadius: 10,
		marginBottom: 12,
	},
	recommendationText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
		flex: 1,
	},
	optionsScroll: {
		paddingVertical: 4,
		gap: 12,
	},
	optionCard: {
		width: 180,
		borderRadius: 12,
		overflow: "hidden",
	},
	optionContent: {
		padding: 12,
		gap: 8,
	},
	optionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	timeContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	timeText: {
		fontFamily: "Inter_700Bold",
		fontSize: 18,
	},
	bestBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	bestText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 10,
		color: "#FFFFFF",
	},
	riskRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	riskIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	riskLabel: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 11,
	},
	alertsText: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
	recommendation: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
	},
	scheduleButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 4,
	},
	scheduleButtonText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 13,
		color: "#FFFFFF",
	},
	footerHint: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
		textAlign: "center",
		marginTop: 12,
	},
});
