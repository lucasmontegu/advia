import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface TypingIndicatorProps {
	size?: "sm" | "md" | "lg";
	label?: string; // Optional contextual label like "Thinking...", "Analyzing route..."
	variant?: "dots" | "wave"; // Animation style
}

const DOT_SIZES = {
	sm: 5,
	md: 6,
	lg: 8,
};

const CONTAINER_PADDING = {
	sm: 6,
	md: 10,
	lg: 14,
};

const LABEL_SIZES = {
	sm: 11,
	md: 12,
	lg: 14,
};

export function TypingIndicator({
	size = "md",
	label,
	variant = "dots",
}: TypingIndicatorProps) {
	const colors = useThemeColors();
	const dotSize = DOT_SIZES[size];
	const padding = CONTAINER_PADDING[size];
	const labelSize = LABEL_SIZES[size];

	const dot1Y = useSharedValue(0);
	const dot2Y = useSharedValue(0);
	const dot3Y = useSharedValue(0);

	const dot1Opacity = useSharedValue(0.5);
	const dot2Opacity = useSharedValue(0.5);
	const dot3Opacity = useSharedValue(0.5);

	useEffect(() => {
		const animateDot = (
			y: SharedValue<number>,
			opacity: SharedValue<number>,
			delay: number,
		) => {
			const bounceHeight = variant === "wave" ? -dotSize * 1.5 : -dotSize;

			y.value = withDelay(
				delay,
				withRepeat(
					withSequence(
						withTiming(bounceHeight, {
							duration: 250,
							easing: Easing.out(Easing.ease),
						}),
						withTiming(0, {
							duration: 250,
							easing: Easing.in(Easing.ease),
						}),
					),
					-1,
					false,
				),
			);
			opacity.value = withDelay(
				delay,
				withRepeat(
					withSequence(
						withTiming(1, { duration: 250 }),
						withTiming(0.5, { duration: 250 }),
					),
					-1,
					false,
				),
			);
		};

		animateDot(dot1Y, dot1Opacity, 0);
		animateDot(dot2Y, dot2Opacity, 120);
		animateDot(dot3Y, dot3Opacity, 240);
	}, [
		dot1Y,
		dot1Opacity,
		dot2Y,
		dot2Opacity,
		dot3Y,
		dot3Opacity,
		dotSize,
		variant,
	]);

	const dot1Style = useAnimatedStyle(() => ({
		transform: [{ translateY: dot1Y.value }],
		opacity: dot1Opacity.value,
	}));

	const dot2Style = useAnimatedStyle(() => ({
		transform: [{ translateY: dot2Y.value }],
		opacity: dot2Opacity.value,
	}));

	const dot3Style = useAnimatedStyle(() => ({
		transform: [{ translateY: dot3Y.value }],
		opacity: dot3Opacity.value,
	}));

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.muted,
					paddingHorizontal: padding * 1.5,
					paddingVertical: padding,
					borderRadius: dotSize * 2.5,
				},
			]}
		>
			{label && (
				<Text
					style={[
						styles.label,
						{
							color: colors.mutedForeground,
							fontSize: labelSize,
							marginRight: 6,
						},
					]}
				>
					{label}
				</Text>
			)}
			<View style={styles.dotsContainer}>
				<Animated.View
					style={[
						styles.dot,
						dot1Style,
						{
							width: dotSize,
							height: dotSize,
							borderRadius: dotSize / 2,
							backgroundColor: colors.primary,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.dot,
						dot2Style,
						{
							width: dotSize,
							height: dotSize,
							borderRadius: dotSize / 2,
							backgroundColor: colors.primary,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.dot,
						dot3Style,
						{
							width: dotSize,
							height: dotSize,
							borderRadius: dotSize / 2,
							backgroundColor: colors.primary,
						},
					]}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
	},
	label: {
		fontFamily: "Inter_400Regular",
	},
	dotsContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		height: 16, // Fixed height to contain bounce animation
		justifyContent: "center",
	},
	dot: {},
});
