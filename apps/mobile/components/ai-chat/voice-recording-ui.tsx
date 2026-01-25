// apps/mobile/components/ai-chat/voice-recording-ui.tsx
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
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

export type VoiceRecordingState = "idle" | "recording" | "processing";

interface VoiceRecordingUIProps {
	state: VoiceRecordingState;
	duration: number; // seconds
	audioLevels?: number[]; // 0-1 values for waveform bars
	onStartRecording: () => void;
	onStopRecording: () => void;
	onCancelRecording: () => void;
	onSendRecording: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Number of waveform bars to display
const WAVEFORM_BARS = 24;

export function VoiceRecordingUI({
	state,
	duration,
	audioLevels = [],
	onStartRecording,
	onStopRecording,
	onCancelRecording,
	onSendRecording,
}: VoiceRecordingUIProps) {
	const colors = useThemeColors();

	const formatDuration = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (state === "idle") {
		return <IdleState onStartRecording={onStartRecording} />;
	}

	if (state === "processing") {
		return <ProcessingState />;
	}

	// Recording state
	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			exiting={FadeOut.duration(150)}
			style={[styles.recordingContainer, { backgroundColor: colors.card }]}
		>
			{/* Cancel button */}
			<Pressable
				onPress={onCancelRecording}
				style={[styles.cancelButton, { backgroundColor: colors.muted }]}
				accessibilityLabel="Cancel recording"
			>
				<Icon name="close" size={18} color={colors.mutedForeground} />
			</Pressable>

			{/* Waveform visualization */}
			<View style={styles.waveformContainer}>
				<WaveformVisualizer audioLevels={audioLevels} isRecording />
			</View>

			{/* Duration */}
			<View style={styles.durationContainer}>
				<RecordingIndicator />
				<Text style={[styles.durationText, { color: colors.foreground }]}>
					{formatDuration(duration)}
				</Text>
			</View>

			{/* Send button */}
			<Pressable
				onPress={onSendRecording}
				style={[styles.sendButton, { backgroundColor: colors.primary }]}
				accessibilityLabel="Send voice message"
			>
				<Icon name="send" size={18} color={colors.primaryForeground} />
			</Pressable>
		</Animated.View>
	);
}

function IdleState({ onStartRecording }: { onStartRecording: () => void }) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);

	const handlePressIn = () => {
		scale.value = withSpring(0.92);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<AnimatedPressable
			onPress={onStartRecording}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.idleButton,
				{ backgroundColor: colors.primary },
				animatedStyle,
			]}
			accessibilityLabel="Start voice recording"
			accessibilityRole="button"
		>
			<Icon name="voice" size={22} color={colors.primaryForeground} />
		</AnimatedPressable>
	);
}

function ProcessingState() {
	const colors = useThemeColors();
	const rotation = useSharedValue(0);

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, { duration: 1000, easing: Easing.linear }),
			-1,
			false,
		);
	}, [rotation]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			style={[styles.processingContainer, { backgroundColor: colors.card }]}
		>
			<Animated.View style={animatedStyle}>
				<Icon name="refresh" size={20} color={colors.primary} />
			</Animated.View>
			<Text style={[styles.processingText, { color: colors.mutedForeground }]}>
				Processing...
			</Text>
		</Animated.View>
	);
}

function RecordingIndicator() {
	const opacity = useSharedValue(1);

	useEffect(() => {
		opacity.value = withRepeat(
			withSequence(
				withTiming(0.3, { duration: 500 }),
				withTiming(1, { duration: 500 }),
			),
			-1,
			false,
		);
	}, [opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return <Animated.View style={[styles.recordingDot, animatedStyle]} />;
}

function WaveformVisualizer({
	audioLevels,
	isRecording,
}: {
	audioLevels: number[];
	isRecording: boolean;
}) {
	const colors = useThemeColors();

	// Generate bars - use actual levels or simulated values
	const bars = useRef<number[]>(
		Array.from({ length: WAVEFORM_BARS }, () => Math.random() * 0.5 + 0.2),
	);

	// Update bars with actual audio levels if provided
	if (audioLevels.length > 0) {
		// Map audio levels to bars
		const step = Math.max(1, Math.floor(audioLevels.length / WAVEFORM_BARS));
		for (let i = 0; i < WAVEFORM_BARS; i++) {
			const levelIndex = Math.min(i * step, audioLevels.length - 1);
			bars.current[i] = audioLevels[levelIndex] || 0.2;
		}
	}

	return (
		<View style={styles.waveform}>
			{bars.current.map((level, index) => (
				<WaveformBar
					key={index}
					level={level}
					index={index}
					isRecording={isRecording}
				/>
			))}
		</View>
	);
}

function WaveformBar({
	level,
	index,
	isRecording,
}: {
	level: number;
	index: number;
	isRecording: boolean;
}) {
	const colors = useThemeColors();
	const height = useSharedValue(level);

	useEffect(() => {
		if (isRecording) {
			// Animate with slight randomness for organic feel
			const delay = index * 30;
			height.value = withRepeat(
				withSequence(
					withTiming(Math.random() * 0.6 + 0.3, {
						duration: 200 + Math.random() * 100,
						easing: Easing.inOut(Easing.ease),
					}),
					withTiming(Math.random() * 0.4 + 0.2, {
						duration: 200 + Math.random() * 100,
						easing: Easing.inOut(Easing.ease),
					}),
				),
				-1,
				true,
			);
		}
	}, [isRecording, index, height]);

	const animatedStyle = useAnimatedStyle(() => ({
		height: interpolate(height.value, [0, 1], [4, 28]),
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

// Compact voice button for inline use in chat input
export function VoiceButton({
	onPress,
	isRecording = false,
	size = "md",
}: {
	onPress: () => void;
	isRecording?: boolean;
	size?: "sm" | "md" | "lg";
}) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);
	const pulseScale = useSharedValue(1);

	const sizes = {
		sm: 32,
		md: 40,
		lg: 48,
	};

	const iconSizes = {
		sm: 16,
		md: 20,
		lg: 24,
	};

	useEffect(() => {
		if (isRecording) {
			pulseScale.value = withRepeat(
				withSequence(
					withTiming(1.15, { duration: 600 }),
					withTiming(1, { duration: 600 }),
				),
				-1,
				false,
			);
		} else {
			pulseScale.value = withTiming(1);
		}
	}, [isRecording, pulseScale]);

	const handlePressIn = () => {
		scale.value = withSpring(0.9);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const buttonStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const pulseStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pulseScale.value }],
		opacity: interpolate(pulseScale.value, [1, 1.15], [0.3, 0]),
	}));

	const buttonSize = sizes[size];
	const iconSize = iconSizes[size];

	return (
		<View style={styles.voiceButtonWrapper}>
			{isRecording && (
				<Animated.View
					style={[
						styles.voiceButtonPulse,
						{
							width: buttonSize,
							height: buttonSize,
							borderRadius: buttonSize / 2,
							backgroundColor: colors.destructive,
						},
						pulseStyle,
					]}
				/>
			)}
			<AnimatedPressable
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				style={[
					styles.voiceButton,
					{
						width: buttonSize,
						height: buttonSize,
						borderRadius: buttonSize / 2,
						backgroundColor: isRecording ? colors.destructive : colors.muted,
					},
					buttonStyle,
				]}
				accessibilityLabel={
					isRecording ? "Stop recording" : "Start voice input"
				}
				accessibilityRole="button"
			>
				<Icon
					name={isRecording ? "close" : "voice"}
					size={iconSize}
					color={isRecording ? "#fff" : colors.mutedForeground}
				/>
			</AnimatedPressable>
		</View>
	);
}

const styles = StyleSheet.create({
	// Idle state
	idleButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},

	// Recording state
	recordingContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 8,
		borderRadius: 28,
		gap: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
	},
	cancelButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	waveformContainer: {
		flex: 1,
		height: 36,
		justifyContent: "center",
	},
	waveform: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		height: 32,
		paddingHorizontal: 4,
	},
	waveformBar: {
		width: 3,
		borderRadius: 1.5,
		minHeight: 4,
	},
	durationContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 4,
	},
	recordingDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#dc2626",
	},
	durationText: {
		fontFamily: "Inter_500Medium",
		fontSize: 14,
		minWidth: 40,
	},
	sendButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},

	// Processing state
	processingContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
		gap: 10,
	},
	processingText: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
	},

	// Voice button (compact)
	voiceButtonWrapper: {
		position: "relative",
		justifyContent: "center",
		alignItems: "center",
	},
	voiceButtonPulse: {
		position: "absolute",
	},
	voiceButton: {
		justifyContent: "center",
		alignItems: "center",
	},
});
