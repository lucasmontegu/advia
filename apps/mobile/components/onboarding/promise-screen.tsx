// apps/mobile/components/onboarding/promise-screen.tsx
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

const { width } = Dimensions.get("window");

export function PromiseScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation();

	// Animations
	const sunriseAnim = useRef(new Animated.Value(0)).current;
	const contentAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const waveAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// Sunrise and content animation
		Animated.sequence([
			Animated.timing(sunriseAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: false,
			}),
			Animated.timing(contentAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
		]).start();

		// Pulse animation for the avatar
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.05,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
			]),
		).start();

		// Wave animation for the waveform
		Animated.loop(
			Animated.timing(waveAnim, {
				toValue: 1,
				duration: 2000,
				useNativeDriver: false,
			}),
		).start();
	}, [sunriseAnim, contentAnim, pulseAnim, waveAnim]);

	// Interpolate background colors for sunrise effect
	const backgroundColor = sunriseAnim.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: ["#1a1a2e", "#2d3a4f", "#4a6fa5"],
	});

	const sunGlow = sunriseAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
	});

	return (
		<Animated.View style={[styles.container, { backgroundColor }]}>
			{/* Sunrise gradient overlay */}
			<Animated.View
				style={[
					styles.sunriseGradient,
					{
						opacity: sunriseAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [0, 0.6],
						}),
					},
				]}
			/>

			{/* Sun glow effect */}
			<Animated.View
				style={[
					styles.sunGlow,
					{
						opacity: sunGlow,
						transform: [
							{
								scale: sunriseAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [0.5, 1],
								}),
							},
						],
					},
				]}
			/>

			{/* Cloud decorations */}
			<Animated.View
				style={[
					styles.cloud,
					styles.cloudLeft,
					{
						opacity: sunriseAnim,
						transform: [
							{
								translateX: sunriseAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [-50, 0],
								}),
							},
						],
					},
				]}
			/>
			<Animated.View
				style={[
					styles.cloud,
					styles.cloudRight,
					{
						opacity: sunriseAnim,
						transform: [
							{
								translateX: sunriseAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [50, 0],
								}),
							},
						],
					},
				]}
			/>

			{/* Main content */}
			<Animated.View
				style={[
					styles.contentContainer,
					{
						opacity: contentAnim,
						transform: [
							{
								translateY: contentAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [30, 0],
								}),
							},
						],
					},
				]}
			>
				{/* AI Avatar with pulse */}
				<Animated.View
					style={[
						styles.avatarContainer,
						{ transform: [{ scale: pulseAnim }] },
					]}
				>
					<View
						style={[
							styles.avatarOuter,
							{ backgroundColor: colors.primary + "30" },
						]}
					>
						<View
							style={[styles.avatarInner, { backgroundColor: colors.primary }]}
						>
							<Icon name="storm" size={36} color="#FFFFFF" />
						</View>
					</View>

					{/* Animated waveform below avatar */}
					<View style={styles.waveformContainer}>
						{[0, 1, 2, 3, 4].map((i) => (
							<Animated.View
								key={i}
								style={[
									styles.waveBar,
									{
										backgroundColor: colors.primary,
										height: waveAnim.interpolate({
											inputRange: [0, 0.5, 1],
											outputRange: [
												8 + (i % 2) * 8,
												16 + ((i + 1) % 3) * 8,
												8 + (i % 2) * 8,
											],
										}),
									},
								]}
							/>
						))}
					</View>
				</Animated.View>

				{/* Text content */}
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: "#FFFFFF" }]}>
						{t("onboarding.promise.title")}
					</Text>
					<Text
						style={[styles.subtitle, { color: "rgba(255, 255, 255, 0.8)" }]}
					>
						{t("onboarding.promise.subtitle")}
					</Text>
				</View>

				{/* Feature hint card */}
				<View
					style={[
						styles.featureCard,
						{ backgroundColor: "rgba(255, 255, 255, 0.15)" },
					]}
				>
					<View style={styles.featureIconContainer}>
						<Icon name="weather" size={20} color="#FFFFFF" />
					</View>
					<Text style={styles.featureText}>
						Real-time weather monitoring on every route
					</Text>
				</View>
			</Animated.View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	sunriseGradient: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "#FFB347",
	},
	sunGlow: {
		position: "absolute",
		bottom: "20%",
		width: 200,
		height: 200,
		borderRadius: 100,
		backgroundColor: "rgba(255, 200, 100, 0.3)",
		zIndex: 1,
	},
	cloud: {
		position: "absolute",
		width: 100,
		height: 40,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		borderRadius: 20,
	},
	cloudLeft: {
		top: "25%",
		left: "5%",
	},
	cloudRight: {
		top: "30%",
		right: "10%",
		width: 80,
		height: 30,
	},
	contentContainer: {
		alignItems: "center",
		paddingHorizontal: 40,
	},
	avatarContainer: {
		alignItems: "center",
		marginBottom: 40,
		zIndex: 5,
	},
	avatarOuter: {
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarInner: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	waveformContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 16,
	},
	waveBar: {
		width: 4,
		borderRadius: 2,
	},
	textContainer: {
		alignItems: "center",
		marginBottom: 32,
	},
	title: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 28,
		marginBottom: 12,
		textAlign: "center",
	},
	subtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 18,
		textAlign: "center",
		lineHeight: 26,
	},
	featureCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 16,
		gap: 12,
	},
	featureIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	featureText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.9)",
		flex: 1,
	},
});
