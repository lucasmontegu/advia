// apps/mobile/components/voice/recording-indicator.tsx

import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
	Extrapolation,
	FadeIn,
	FadeOut,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { RecordingState } from "@/hooks/use-voice-recording";

type RecordingIndicatorProps = {
	state: RecordingState;
	duration: number;
	compact?: boolean;
};

// Waveform bars count
const BARS_COUNT = 5;

function WaveformBar({
	index,
	isRecording,
}: {
	index: number;
	isRecording: boolean;
}) {
	const colors = useThemeColors();
	const height = useSharedValue(0.3);

	useEffect(() => {
		if (isRecording) {
			// Each bar has a slightly different animation timing
			const delay = index * 80;
			height.value = withRepeat(
				withSequence(
					withTiming(Math.random() * 0.5 + 0.3, { duration: 200 + delay }),
					withTiming(Math.random() * 0.7 + 0.5, { duration: 150 + delay }),
					withTiming(Math.random() * 0.4 + 0.2, { duration: 180 + delay }),
				),
				-1,
				true,
			);
		} else {
			height.value = withTiming(0.3, { duration: 200 });
		}
	}, [isRecording, index, height]);

	const animatedStyle = useAnimatedStyle(() => ({
		height: interpolate(height.value, [0, 1], [8, 32], Extrapolation.CLAMP),
	}));

	return (
		<Animated.View
			style={[
				styles.waveformBar,
				{ backgroundColor: colors.primary },
				animatedStyle,
			]}
		/>
	);
}

function PulsingDot() {
	const colors = useThemeColors();
	const scale = useSharedValue(1);
	const opacity = useSharedValue(1);

	useEffect(() => {
		scale.value = withRepeat(
			withSequence(
				withTiming(1.5, { duration: 500 }),
				withTiming(1, { duration: 500 }),
			),
			-1,
			false,
		);
		opacity.value = withRepeat(
			withSequence(
				withTiming(0.5, { duration: 500 }),
				withTiming(1, { duration: 500 }),
			),
			-1,
			false,
		);
	}, [scale, opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={[
				styles.pulsingDot,
				{ backgroundColor: colors.danger },
				animatedStyle,
			]}
		/>
	);
}

function ProcessingSpinner() {
	const colors = useThemeColors();
	const rotation = useSharedValue(0);

	useEffect(() => {
		rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
	}, [rotation]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	return (
		<Animated.View style={[styles.spinner, animatedStyle]}>
			<View
				style={[
					styles.spinnerArc,
					{ borderColor: colors.primary, borderTopColor: "transparent" },
				]}
			/>
		</Animated.View>
	);
}

export function RecordingIndicator({
	state,
	duration,
	compact = false,
}: RecordingIndicatorProps) {
	const colors = useThemeColors();

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (state === "idle" || state === "done") {
		return null;
	}

	if (state === "error") {
		return (
			<Animated.View
				entering={FadeIn.duration(200)}
				exiting={FadeOut.duration(200)}
				style={[
					styles.container,
					styles.errorContainer,
					{ backgroundColor: colors.danger + "15" },
				]}
			>
				<Icon name="alert" size={20} color={colors.danger} />
				<Text style={[styles.errorText, { color: colors.danger }]}>
					Error de grabación
				</Text>
			</Animated.View>
		);
	}

	if (state === "processing") {
		return (
			<Animated.View
				entering={FadeIn.duration(200)}
				exiting={FadeOut.duration(200)}
				style={[
					styles.container,
					compact && styles.containerCompact,
					{ backgroundColor: colors.card },
				]}
			>
				<ProcessingSpinner />
				<Text style={[styles.processingText, { color: colors.foreground }]}>
					Procesando...
				</Text>
			</Animated.View>
		);
	}

	// Recording state
	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			exiting={FadeOut.duration(200)}
			style={[
				styles.container,
				compact && styles.containerCompact,
				{ backgroundColor: colors.card },
			]}
		>
			{/* Recording dot */}
			<PulsingDot />

			{/* Waveform */}
			<View style={styles.waveformContainer}>
				{Array.from({ length: BARS_COUNT }).map((_, index) => (
					<WaveformBar
						key={index}
						index={index}
						isRecording={state === "recording"}
					/>
				))}
			</View>

			{/* Duration */}
			<Text style={[styles.duration, { color: colors.foreground }]}>
				{formatDuration(duration)}
			</Text>

			{/* Hint */}
			{!compact && (
				<Text style={[styles.hint, { color: colors.mutedForeground }]}>
					Suelta para enviar
				</Text>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 16,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	containerCompact: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		gap: 8,
	},
	pulsingDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	waveformContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		height: 32,
	},
	waveformBar: {
		width: 4,
		borderRadius: 2,
	},
	duration: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
		minWidth: 40,
	},
	hint: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		marginLeft: "auto",
	},
	errorContainer: {
		gap: 8,
	},
	errorText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
	},
	processingText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
	},
	spinner: {
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	spinnerArc: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
	},
});
