// apps/mobile/components/driving-mode/driving-mode-overlay.tsx

import { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	FadeOut,
	SlideInDown,
	SlideOutDown,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/icons";
import type { RoadRisk } from "@/hooks/use-route-weather";
import { useThemeColors } from "@/hooks/use-theme-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type DrivingAlert = {
	id: string;
	type: "weather" | "traffic" | "hazard" | "fuel" | "rest";
	severity: RoadRisk;
	title: string;
	subtitle?: string;
	actionLabel?: string;
	dismissible?: boolean;
};

interface DrivingModeOverlayProps {
	isActive: boolean;
	currentAlert?: DrivingAlert;
	isListening: boolean;
	eta?: string;
	distanceRemaining?: string;
	nextManeuver?: string;
	onVoicePress: () => void;
	onAlertAction?: () => void;
	onAlertDismiss?: () => void;
	onExitDrivingMode: () => void;
}

const ALERT_COLORS: Record<RoadRisk, { bg: string; border: string }> = {
	low: { bg: "rgba(34, 197, 94, 0.95)", border: "#16a34a" },
	moderate: { bg: "rgba(234, 179, 8, 0.95)", border: "#ca8a04" },
	high: { bg: "rgba(249, 115, 22, 0.95)", border: "#ea580c" },
	extreme: { bg: "rgba(220, 38, 38, 0.95)", border: "#dc2626" },
};

const ALERT_ICONS: Record<DrivingAlert["type"], IconName> = {
	weather: "weather",
	traffic: "alert",
	hazard: "warning",
	fuel: "gas",
	rest: "clock",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DrivingModeOverlay({
	isActive,
	currentAlert,
	isListening,
	eta,
	distanceRemaining,
	nextManeuver,
	onVoicePress,
	onAlertAction,
	onAlertDismiss,
	onExitDrivingMode,
}: DrivingModeOverlayProps) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();

	if (!isActive) return null;

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			exiting={FadeOut.duration(200)}
			style={[
				styles.overlay,
				{
					paddingTop: insets.top + 12,
					paddingBottom: insets.bottom + 12,
				},
			]}
		>
			{/* Top bar - minimal info */}
			<View style={styles.topBar}>
				<Pressable
					onPress={onExitDrivingMode}
					style={[styles.exitButton, { backgroundColor: colors.muted + "80" }]}
					accessibilityLabel="Exit driving mode"
				>
					<Icon name="close" size={20} color={colors.foreground} />
				</Pressable>

				{/* Route info */}
				<View style={styles.routeInfo}>
					{nextManeuver && (
						<Text style={[styles.maneuverText, { color: colors.foreground }]}>
							{nextManeuver}
						</Text>
					)}
					<View style={styles.etaRow}>
						{eta && (
							<Text style={[styles.etaText, { color: colors.primary }]}>
								{eta}
							</Text>
						)}
						{distanceRemaining && (
							<Text
								style={[styles.distanceText, { color: colors.mutedForeground }]}
							>
								{distanceRemaining}
							</Text>
						)}
					</View>
				</View>
			</View>

			{/* Alert card (proactive) */}
			{currentAlert && (
				<DrivingAlertCard
					alert={currentAlert}
					onAction={onAlertAction}
					onDismiss={onAlertDismiss}
				/>
			)}

			{/* Large voice button - bottom center */}
			<View style={styles.bottomArea}>
				<LargeVoiceButton isListening={isListening} onPress={onVoicePress} />
				<Text style={[styles.voiceHint, { color: colors.mutedForeground }]}>
					{isListening ? "Listening..." : 'Tap or say "Hey Driwet"'}
				</Text>
			</View>
		</Animated.View>
	);
}

function DrivingAlertCard({
	alert,
	onAction,
	onDismiss,
}: {
	alert: DrivingAlert;
	onAction?: () => void;
	onDismiss?: () => void;
}) {
	const alertColor = ALERT_COLORS[alert.severity];
	const iconName = ALERT_ICONS[alert.type];

	return (
		<Animated.View
			entering={SlideInDown.duration(300).springify()}
			exiting={SlideOutDown.duration(200)}
			style={[
				styles.alertCard,
				{
					backgroundColor: alertColor.bg,
					borderColor: alertColor.border,
				},
			]}
		>
			<View style={styles.alertContent}>
				<View style={styles.alertIconContainer}>
					<Icon name={iconName} size={28} color="#fff" />
				</View>
				<View style={styles.alertTextContainer}>
					<Text style={styles.alertTitle}>{alert.title}</Text>
					{alert.subtitle && (
						<Text style={styles.alertSubtitle}>{alert.subtitle}</Text>
					)}
				</View>
			</View>

			<View style={styles.alertActions}>
				{alert.actionLabel && onAction && (
					<Pressable
						onPress={onAction}
						style={styles.alertActionButton}
						accessibilityLabel={alert.actionLabel}
					>
						<Text style={styles.alertActionText}>{alert.actionLabel}</Text>
					</Pressable>
				)}
				{alert.dismissible && onDismiss && (
					<Pressable
						onPress={onDismiss}
						style={styles.alertDismissButton}
						accessibilityLabel="Dismiss alert"
					>
						<Icon name="close" size={20} color="rgba(255,255,255,0.8)" />
					</Pressable>
				)}
			</View>
		</Animated.View>
	);
}

function LargeVoiceButton({
	isListening,
	onPress,
}: {
	isListening: boolean;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	const scale = useSharedValue(1);
	const pulseScale = useSharedValue(1);
	const pulseOpacity = useSharedValue(0);

	useEffect(() => {
		if (isListening) {
			pulseScale.value = withRepeat(
				withSequence(
					withTiming(1.3, { duration: 800 }),
					withTiming(1, { duration: 800 }),
				),
				-1,
				false,
			);
			pulseOpacity.value = withRepeat(
				withSequence(
					withTiming(0.4, { duration: 800 }),
					withTiming(0, { duration: 800 }),
				),
				-1,
				false,
			);
		} else {
			pulseScale.value = withTiming(1);
			pulseOpacity.value = withTiming(0);
		}
	}, [isListening, pulseScale, pulseOpacity]);

	const handlePressIn = () => {
		scale.value = withSpring(0.92);
	};

	const handlePressOut = () => {
		scale.value = withSpring(1);
	};

	const buttonStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const pulseStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pulseScale.value }],
		opacity: pulseOpacity.value,
	}));

	return (
		<View style={styles.voiceButtonWrapper}>
			<Animated.View
				style={[
					styles.voicePulse,
					{ backgroundColor: colors.primary },
					pulseStyle,
				]}
			/>
			<AnimatedPressable
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				style={[
					styles.largeVoiceButton,
					{
						backgroundColor: isListening ? colors.destructive : colors.primary,
					},
					buttonStyle,
				]}
				accessibilityLabel={
					isListening ? "Stop listening" : "Start voice command"
				}
				accessibilityRole="button"
			>
				<Icon name="voice" size={40} color="#fff" />
			</AnimatedPressable>
		</View>
	);
}

// Compact status bar for when minimized
export function DrivingModeStatusBar({
	eta,
	isListening,
	onExpand,
}: {
	eta?: string;
	isListening: boolean;
	onExpand: () => void;
}) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();

	return (
		<Pressable
			onPress={onExpand}
			style={[
				styles.statusBar,
				{
					backgroundColor: colors.primary,
					paddingTop: insets.top + 4,
				},
			]}
			accessibilityLabel="Expand driving mode"
		>
			<View style={styles.statusBarContent}>
				<Icon name="navigation" size={16} color="#fff" />
				{eta && <Text style={styles.statusBarEta}>{eta}</Text>}
				{isListening && (
					<View style={styles.listeningIndicator}>
						<Icon name="voice" size={14} color="#fff" />
					</View>
				)}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.85)",
		justifyContent: "space-between",
		paddingHorizontal: 20,
	},

	// Top bar
	topBar: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 16,
	},
	exitButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},
	routeInfo: {
		flex: 1,
	},
	maneuverText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 18,
		marginBottom: 4,
	},
	etaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	etaText: {
		fontFamily: "Inter_700Bold",
		fontSize: 24,
	},
	distanceText: {
		fontFamily: "Inter_400Regular",
		fontSize: 16,
	},

	// Alert card
	alertCard: {
		borderRadius: 16,
		borderWidth: 2,
		padding: 16,
		marginVertical: 20,
	},
	alertContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginBottom: 12,
	},
	alertIconContainer: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: "rgba(0,0,0,0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	alertTextContainer: {
		flex: 1,
	},
	alertTitle: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 18,
		color: "#fff",
	},
	alertSubtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		color: "rgba(255,255,255,0.85)",
		marginTop: 2,
	},
	alertActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	alertActionButton: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.25)",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	alertActionText: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 16,
		color: "#fff",
	},
	alertDismissButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "rgba(0,0,0,0.2)",
		justifyContent: "center",
		alignItems: "center",
	},

	// Voice button
	bottomArea: {
		alignItems: "center",
		paddingBottom: 20,
	},
	voiceButtonWrapper: {
		position: "relative",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	voicePulse: {
		position: "absolute",
		width: 100,
		height: 100,
		borderRadius: 50,
	},
	largeVoiceButton: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	voiceHint: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
	},

	// Status bar (minimized)
	statusBar: {
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	statusBarContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	statusBarEta: {
		fontFamily: "Inter_600SemiBold",
		fontSize: 14,
		color: "#fff",
	},
	listeningIndicator: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
});
