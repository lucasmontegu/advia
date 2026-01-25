// apps/mobile/components/onboarding/demo-screen.tsx
import { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	FadeInDown,
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";
import { colors as themeColors } from "@/theme/colors";

const { width } = Dimensions.get("window");
const MAP_HEIGHT = 280;

// Weather segment data for the demo
const WEATHER_SEGMENTS = [
	{ km: 0, icon: "weather" as const, temp: 28, risk: "safe" as const },
	{ km: 50, icon: "weather" as const, temp: 26, risk: "safe" as const },
	{ km: 100, icon: "storm" as const, temp: 22, risk: "danger" as const },
	{ km: 150, icon: "weather" as const, temp: 24, risk: "caution" as const },
	{ km: 200, icon: "weather" as const, temp: 27, risk: "safe" as const },
];

export function DemoScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation();

	// Animation states
	const [showRoute, setShowRoute] = useState(false);
	const [showWeatherSegments, setShowWeatherSegments] = useState(false);
	const [showStormPulse, setShowStormPulse] = useState(false);
	const [showAIMessage, setShowAIMessage] = useState(false);
	const [showSafeStop, setShowSafeStop] = useState(false);

	// Animated values
	const routeProgress = useSharedValue(0);
	const stormPulse = useSharedValue(1);
	const safeStopScale = useSharedValue(0);

	useEffect(() => {
		// Animation sequence timing
		const timers: ReturnType<typeof setTimeout>[] = [];

		// Step 1: Show route drawing
		timers.push(setTimeout(() => setShowRoute(true), 500));
		routeProgress.value = withDelay(500, withTiming(1, { duration: 1500 }));

		// Step 2: Show weather segments
		timers.push(setTimeout(() => setShowWeatherSegments(true), 2200));

		// Step 3: Pulse storm warning
		timers.push(
			setTimeout(() => {
				setShowStormPulse(true);
				stormPulse.value = withRepeat(
					withSequence(
						withTiming(1.3, { duration: 600 }),
						withTiming(1, { duration: 600 }),
					),
					-1,
				);
			}, 3000),
		);

		// Step 4: Show AI message
		timers.push(setTimeout(() => setShowAIMessage(true), 3800));

		// Step 5: Show safe stop pin
		timers.push(
			setTimeout(() => {
				setShowSafeStop(true);
				safeStopScale.value = withSpring(1, { damping: 12 });
			}, 5000),
		);

		return () => timers.forEach(clearTimeout);
	}, [routeProgress, stormPulse, safeStopScale]);

	const routeAnimatedStyle = useAnimatedStyle(() => ({
		width: `${routeProgress.value * 100}%`,
	}));

	const stormAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: stormPulse.value }],
	}));

	const safeStopAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: safeStopScale.value }],
		opacity: safeStopScale.value,
	}));

	const getRiskColor = (risk: "safe" | "caution" | "danger") => {
		const safetyColors = themeColors.safety;
		return safetyColors[risk].icon;
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Title */}
			<Animated.View
				entering={FadeInDown.delay(200).duration(500)}
				style={[styles.titleContainer, { paddingTop: insets.top + 20 }]}
			>
				<Text style={[styles.title, { color: colors.foreground }]}>
					{t("onboarding.demo.title")}
				</Text>
			</Animated.View>

			{/* Mini map visualization */}
			<Animated.View
				entering={FadeIn.delay(300).duration(600)}
				style={[styles.mapContainer, { backgroundColor: colors.card }]}
			>
				{/* Route label */}
				<View style={styles.routeLabel}>
					<Text
						style={[styles.routeLabelText, { color: colors.mutedForeground }]}
					>
						{t("onboarding.demo.routeLabel")}
					</Text>
				</View>

				{/* Simplified map background */}
				<View style={styles.mapBackground}>
					{/* Grid lines */}
					{[...Array(5)].map((_, i) => (
						<View
							key={`h-${i}`}
							style={[
								styles.gridLine,
								styles.horizontalGrid,
								{ top: `${20 + i * 15}%`, backgroundColor: colors.border },
							]}
						/>
					))}
				</View>

				{/* Route line with animation */}
				<View style={styles.routeContainer}>
					{/* Route background (gray) */}
					<View style={[styles.routeLine, { backgroundColor: colors.muted }]} />

					{/* Route progress (primary color) */}
					<Animated.View
						style={[
							styles.routeLineProgress,
							{ backgroundColor: colors.primary },
							routeAnimatedStyle,
						]}
					/>

					{/* Origin pin */}
					<View style={[styles.originPin, { backgroundColor: colors.primary }]}>
						<View style={styles.pinDot} />
					</View>

					{/* Destination pin */}
					<View
						style={[styles.destinationPin, { backgroundColor: colors.primary }]}
					>
						<Icon name="location" size={16} color="#FFFFFF" />
					</View>

					{/* Storm zone highlight */}
					{showStormPulse && (
						<Animated.View
							style={[
								styles.stormZone,
								{ backgroundColor: themeColors.safety.danger.icon + "30" },
								stormAnimatedStyle,
							]}
						/>
					)}

					{/* Safe stop pin */}
					{showSafeStop && (
						<Animated.View style={[styles.safeStopPin, safeStopAnimatedStyle]}>
							<View
								style={[
									styles.safeStopMarker,
									{ backgroundColor: themeColors.safety.safe.icon },
								]}
							>
								<Text style={styles.safeStopIcon}>⛽</Text>
							</View>
							<View
								style={[styles.safeStopLabel, { backgroundColor: colors.card }]}
							>
								<Text
									style={[styles.safeStopText, { color: colors.foreground }]}
								>
									Safe Stop
								</Text>
							</View>
						</Animated.View>
					)}
				</View>

				{/* Weather segments timeline */}
				{showWeatherSegments && (
					<Animated.View
						entering={FadeInUp.duration(500)}
						style={styles.weatherTimeline}
					>
						{WEATHER_SEGMENTS.map((segment, index) => (
							<Animated.View
								key={segment.km}
								entering={FadeIn.delay(index * 100).duration(300)}
								style={[
									styles.weatherSegment,
									{
										backgroundColor: getRiskColor(segment.risk) + "20",
										borderColor: getRiskColor(segment.risk),
									},
								]}
							>
								<Icon
									name={segment.icon}
									size={16}
									color={getRiskColor(segment.risk)}
								/>
								<Text
									style={[styles.segmentKm, { color: colors.mutedForeground }]}
								>
									{segment.km}km
								</Text>
							</Animated.View>
						))}
					</Animated.View>
				)}
			</Animated.View>

			{/* AI Message bubble */}
			{showAIMessage && (
				<Animated.View
					entering={FadeInUp.duration(500)}
					style={styles.aiMessageContainer}
				>
					<View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
						<Icon name="storm" size={20} color="#FFFFFF" />
					</View>
					<View
						style={[styles.aiMessageBubble, { backgroundColor: colors.card }]}
					>
						<Text style={[styles.aiMessageText, { color: colors.foreground }]}>
							{t("onboarding.demo.aiMessage")}
						</Text>
					</View>
				</Animated.View>
			)}

			{/* Feature highlights */}
			<Animated.View
				entering={FadeInUp.delay(5500).duration(500)}
				style={styles.featuresContainer}
			>
				<View style={styles.featureRow}>
					<View
						style={[
							styles.featureBadge,
							{ backgroundColor: themeColors.safety.safe.icon + "20" },
						]}
					>
						<Icon name="route" size={16} color={themeColors.safety.safe.icon} />
					</View>
					<Text style={[styles.featureText, { color: colors.mutedForeground }]}>
						Weather every 50km
					</Text>
				</View>
				<View style={styles.featureRow}>
					<View
						style={[
							styles.featureBadge,
							{ backgroundColor: colors.primary + "20" },
						]}
					>
						<Icon name="notification" size={16} color={colors.primary} />
					</View>
					<Text style={[styles.featureText, { color: colors.mutedForeground }]}>
						Proactive alerts
					</Text>
				</View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	titleContainer: {
		paddingHorizontal: 24,
		marginBottom: 24,
	},
	title: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 24,
		textAlign: "center",
	},
	mapContainer: {
		marginHorizontal: 24,
		height: MAP_HEIGHT,
		borderRadius: 20,
		overflow: "hidden",
		position: "relative",
	},
	routeLabel: {
		position: "absolute",
		top: 12,
		left: 12,
		zIndex: 10,
	},
	routeLabelText: {
		fontFamily: "Inter_500Medium",
		fontSize: 12,
	},
	mapBackground: {
		...StyleSheet.absoluteFillObject,
	},
	gridLine: {
		position: "absolute",
		height: 1,
		left: 0,
		right: 0,
	},
	horizontalGrid: {},
	routeContainer: {
		position: "absolute",
		top: "50%",
		left: 30,
		right: 30,
		height: 6,
		marginTop: -3,
	},
	routeLine: {
		position: "absolute",
		left: 0,
		right: 0,
		height: 6,
		borderRadius: 3,
	},
	routeLineProgress: {
		position: "absolute",
		left: 0,
		height: 6,
		borderRadius: 3,
	},
	originPin: {
		position: "absolute",
		left: -8,
		top: -10,
		width: 26,
		height: 26,
		borderRadius: 13,
		justifyContent: "center",
		alignItems: "center",
	},
	pinDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#FFFFFF",
	},
	destinationPin: {
		position: "absolute",
		right: -8,
		top: -10,
		width: 26,
		height: 26,
		borderRadius: 13,
		justifyContent: "center",
		alignItems: "center",
	},
	stormZone: {
		position: "absolute",
		left: "45%",
		top: -20,
		width: "20%",
		height: 46,
		borderRadius: 8,
		zIndex: 5,
	},
	safeStopPin: {
		position: "absolute",
		left: "38%",
		top: -45,
		alignItems: "center",
		zIndex: 10,
	},
	safeStopMarker: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	safeStopIcon: {
		fontSize: 16,
	},
	safeStopLabel: {
		marginTop: 4,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	safeStopText: {
		fontFamily: "Inter_500Medium",
		fontSize: 10,
	},
	weatherTimeline: {
		position: "absolute",
		bottom: 16,
		left: 16,
		right: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		zIndex: 15,
	},
	weatherSegment: {
		alignItems: "center",
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	segmentKm: {
		fontFamily: "Inter_500Medium",
		fontSize: 10,
		marginTop: 2,
	},
	aiMessageContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 24,
		marginTop: 24,
		gap: 12,
	},
	aiAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	aiMessageBubble: {
		flex: 1,
		padding: 16,
		borderRadius: 16,
		borderTopLeftRadius: 4,
	},
	aiMessageText: {
		fontFamily: "Inter_400Regular",
		fontSize: 15,
		lineHeight: 22,
	},
	featuresContainer: {
		paddingHorizontal: 24,
		marginTop: 24,
		gap: 12,
	},
	featureRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	featureBadge: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	featureText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
	},
});
