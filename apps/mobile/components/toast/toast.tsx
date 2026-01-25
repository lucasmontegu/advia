// apps/mobile/components/toast/toast.tsx

import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	FadeIn,
	FadeOut,
	runOnJS,
	SlideInDown,
	SlideOutDown,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";

// ============ Types ============

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	action?: {
		label: string;
		onPress: () => void;
	};
	dismissible: boolean;
	onDismiss: (id: string) => void;
	index: number;
}

// ============ Configuration ============

const TOAST_CONFIG: Record<
	ToastType,
	{ bg: string; border: string; icon: IconName; iconColor: string }
> = {
	success: {
		bg: "rgba(34, 197, 94, 0.95)",
		border: "#16a34a",
		icon: "check",
		iconColor: "#ffffff",
	},
	error: {
		bg: "rgba(239, 68, 68, 0.95)",
		border: "#dc2626",
		icon: "warning",
		iconColor: "#ffffff",
	},
	warning: {
		bg: "rgba(234, 179, 8, 0.95)",
		border: "#ca8a04",
		icon: "alert",
		iconColor: "#1a1a1a",
	},
	info: {
		bg: "rgba(59, 130, 246, 0.95)",
		border: "#2563eb",
		icon: "info",
		iconColor: "#ffffff",
	},
};

const SWIPE_THRESHOLD = 50;

// ============ Component ============

export function Toast({
	id,
	message,
	type,
	duration,
	action,
	dismissible,
	onDismiss,
	index,
}: ToastProps) {
	const config = TOAST_CONFIG[type];
	const translateX = useSharedValue(0);
	const opacity = useSharedValue(1);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Auto-dismiss after duration
	useEffect(() => {
		if (duration > 0) {
			timeoutRef.current = setTimeout(() => {
				onDismiss(id);
			}, duration);
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [duration, id, onDismiss]);

	// Swipe to dismiss gesture
	const panGesture = Gesture.Pan()
		.enabled(dismissible)
		.onUpdate((event) => {
			translateX.value = event.translationX;
			opacity.value = 1 - Math.abs(event.translationX) / 200;
		})
		.onEnd((event) => {
			if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
				translateX.value = withTiming(
					event.translationX > 0 ? 400 : -400,
					{ duration: 200 },
					() => {
						runOnJS(onDismiss)(id);
					},
				);
			} else {
				translateX.value = withTiming(0);
				opacity.value = withTiming(1);
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
		opacity: opacity.value,
	}));

	const handleDismiss = () => {
		if (dismissible) {
			onDismiss(id);
		}
	};

	const handleAction = () => {
		action?.onPress();
		onDismiss(id);
	};

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View
				entering={SlideInDown.springify()
					.damping(15)
					.delay(index * 50)}
				exiting={SlideOutDown.duration(200)}
				style={[
					styles.container,
					{ backgroundColor: config.bg, borderColor: config.border },
					animatedStyle,
				]}
			>
				<View style={styles.iconContainer}>
					<Icon name={config.icon} size={20} color={config.iconColor} />
				</View>

				<Text
					style={[
						styles.message,
						{ color: type === "warning" ? "#1a1a1a" : "#ffffff" },
					]}
					numberOfLines={2}
				>
					{message}
				</Text>

				{action && (
					<Pressable
						onPress={handleAction}
						style={styles.actionButton}
						accessibilityLabel={action.label}
					>
						<Text
							style={[
								styles.actionText,
								{ color: type === "warning" ? "#1a1a1a" : "#ffffff" },
							]}
						>
							{action.label}
						</Text>
					</Pressable>
				)}

				{dismissible && !action && (
					<Pressable
						onPress={handleDismiss}
						style={styles.dismissButton}
						accessibilityLabel="Dismiss"
					>
						<Icon
							name="close"
							size={16}
							color={type === "warning" ? "#1a1a1a" : "rgba(255,255,255,0.7)"}
						/>
					</Pressable>
				)}
			</Animated.View>
		</GestureDetector>
	);
}

// ============ Styles ============

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		borderRadius: 14,
		borderWidth: 1,
		gap: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 6,
	},
	iconContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(0,0,0,0.15)",
		justifyContent: "center",
		alignItems: "center",
	},
	message: {
		flex: 1,
		fontSize: 14,
		fontFamily: "Inter_500Medium",
		lineHeight: 20,
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: "rgba(0,0,0,0.15)",
		borderRadius: 8,
	},
	actionText: {
		fontSize: 14,
		fontFamily: "Inter_600SemiBold",
	},
	dismissButton: {
		padding: 4,
	},
});
