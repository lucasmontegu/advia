// apps/mobile/components/route/weather-timeline.tsx
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import type { RoadRisk } from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
	type WeatherCondition,
	WeatherSegmentCard,
	type WeatherSegmentData,
	WeatherSegmentDetail,
} from "./weather-segment-card";

type WeatherTimelineProps = {
	segments: WeatherSegmentData[];
	overallRisk: RoadRisk;
	totalDistanceKm?: number;
	totalDurationMinutes?: number;
	isLoading?: boolean;
	compact?: boolean;
	onSegmentPress?: (segment: WeatherSegmentData, index: number) => void;
};

const OVERALL_RISK_MESSAGES: Record<RoadRisk, string> = {
	low: "Good conditions for your trip",
	moderate: "Some caution recommended",
	high: "Difficult conditions ahead",
	extreme: "Dangerous - consider postponing",
};

const OVERALL_RISK_ICONS: Record<RoadRisk, "check" | "alert"> = {
	low: "check",
	moderate: "alert",
	high: "alert",
	extreme: "alert",
};

export function WeatherTimeline({
	segments,
	overallRisk,
	totalDistanceKm,
	totalDurationMinutes,
	isLoading = false,
	compact = false,
	onSegmentPress,
}: WeatherTimelineProps) {
	const colors = useThemeColors();
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const handleSegmentPress = useCallback(
		(segment: WeatherSegmentData, index: number) => {
			setSelectedIndex((prev) => (prev === index ? null : index));
			onSegmentPress?.(segment, index);
		},
		[onSegmentPress],
	);

	const handleCloseDetail = useCallback(() => {
		setSelectedIndex(null);
	}, []);

	const selectedSegment =
		selectedIndex !== null ? segments[selectedIndex] : null;

	const formatDuration = (minutes: number): string => {
		if (minutes < 60) {
			return `${minutes} min`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	};

	if (isLoading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.card }]}>
				<View style={styles.loadingContainer}>
					<Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
						Analyzing route weather...
					</Text>
				</View>
			</View>
		);
	}

	if (segments.length === 0) {
		return null;
	}

	return (
		<Animated.View
			entering={FadeIn.duration(400)}
			style={[styles.container, { backgroundColor: colors.card }]}
		>
			{/* Header with overall risk */}
			<Animated.View
				entering={FadeInUp.delay(100).duration(300)}
				style={styles.header}
			>
				<View style={styles.headerLeft}>
					<Icon
						name={OVERALL_RISK_ICONS[overallRisk]}
						size={18}
						color={getRiskColor(overallRisk)}
					/>
					<Text style={[styles.headerTitle, { color: colors.foreground }]}>
						Route Weather
					</Text>
				</View>
				{totalDistanceKm !== undefined &&
					totalDurationMinutes !== undefined && (
						<Text
							style={[styles.headerMeta, { color: colors.mutedForeground }]}
						>
							{Math.round(totalDistanceKm)} km •{" "}
							{formatDuration(totalDurationMinutes)}
						</Text>
					)}
			</Animated.View>

			{/* Overall risk message */}
			<Animated.View
				entering={FadeInUp.delay(150).duration(300)}
				style={[
					styles.riskBanner,
					{ backgroundColor: getRiskColor(overallRisk) + "15" },
				]}
			>
				<Text
					style={[styles.riskMessage, { color: getRiskColor(overallRisk) }]}
				>
					{OVERALL_RISK_MESSAGES[overallRisk]}
				</Text>
			</Animated.View>

			{/* Horizontal scrollable segments */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.segmentsContainer}
				style={styles.segmentsScroll}
			>
				{segments.map((segment, index) => (
					<WeatherSegmentCard
						key={`segment-${segment.kmStart}`}
						segment={segment}
						index={index}
						isSelected={selectedIndex === index}
						onPress={() => handleSegmentPress(segment, index)}
						compact={compact}
					/>
				))}
			</ScrollView>

			{/* Legend */}
			{!compact && (
				<Animated.View
					entering={FadeInUp.delay(200).duration(300)}
					style={styles.legend}
				>
					<LegendItem color="#22c55e" label="Safe" />
					<LegendItem color="#eab308" label="Caution" />
					<LegendItem color="#f97316" label="Warning" />
					<LegendItem color="#dc2626" label="Danger" />
				</Animated.View>
			)}

			{/* Expanded detail view */}
			{selectedSegment && (
				<WeatherSegmentDetail
					segment={selectedSegment}
					onClose={handleCloseDetail}
				/>
			)}
		</Animated.View>
	);
}

function LegendItem({ color, label }: { color: string; label: string }) {
	const colors = useThemeColors();

	return (
		<View style={styles.legendItem}>
			<View style={[styles.legendDot, { backgroundColor: color }]} />
			<Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
				{label}
			</Text>
		</View>
	);
}

function getRiskColor(risk: RoadRisk): string {
	const riskColors: Record<RoadRisk, string> = {
		low: "#22c55e",
		moderate: "#eab308",
		high: "#f97316",
		extreme: "#dc2626",
	};
	return riskColors[risk];
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		padding: 16,
		marginHorizontal: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
	},
	loadingContainer: {
		padding: 20,
		alignItems: "center",
	},
	loadingText: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	headerTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
	},
	headerMeta: {
		fontFamily: "Inter_400Regular",
		fontSize: 13,
	},
	riskBanner: {
		padding: 10,
		borderRadius: 10,
		marginBottom: 14,
	},
	riskMessage: {
		fontFamily: "Inter_500Medium",
		fontSize: 13,
		textAlign: "center",
	},
	segmentsScroll: {
		marginHorizontal: -16,
	},
	segmentsContainer: {
		paddingHorizontal: 16,
		gap: 10,
	},
	legend: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
		marginTop: 14,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(128, 128, 128, 0.1)",
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	legendDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	legendLabel: {
		fontFamily: "Inter_400Regular",
		fontSize: 11,
	},
});
