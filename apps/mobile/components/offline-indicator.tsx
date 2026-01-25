// apps/mobile/components/offline-indicator.tsx

import { StyleSheet, Text, View } from "react-native";
import Animated, {
	FadeIn,
	FadeOut,
	SlideInUp,
	SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { useNetworkStatus } from "@/hooks/use-offline-mode";

interface OfflineIndicatorProps {
	/**
	 * Whether to show as a banner at top of screen
	 */
	variant?: "banner" | "badge";
	/**
	 * Message to display (default: "No internet connection")
	 */
	message?: string;
}

/**
 * Indicator that shows when the device is offline
 *
 * @example
 * // As a banner at top of app
 * <OfflineIndicator />
 *
 * // As a small badge
 * <OfflineIndicator variant="badge" />
 */
export function OfflineIndicator({
	variant = "banner",
	message = "No internet connection",
}: OfflineIndicatorProps) {
	const { isOffline } = useNetworkStatus();
	const insets = useSafeAreaInsets();

	if (!isOffline) {
		return null;
	}

	if (variant === "badge") {
		return (
			<Animated.View
				entering={FadeIn.duration(200)}
				exiting={FadeOut.duration(200)}
				style={styles.badge}
			>
				<Icon name="alert" size={12} color="#fafafa" />
				<Text style={styles.badgeText}>Offline</Text>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			entering={SlideInUp.duration(300)}
			exiting={SlideOutUp.duration(200)}
			style={[styles.banner, { paddingTop: insets.top + 8 }]}
		>
			<Icon name="alert" size={16} color="#fafafa" />
			<Text style={styles.bannerText}>{message}</Text>
			<Text style={styles.subtext}>Some features may be limited</Text>
		</Animated.View>
	);
}

/**
 * Wrapper that shows offline state with cached data indicator
 */
export function OfflineDataIndicator({
	dataType,
	cachedAt,
}: {
	dataType: "route" | "weather" | "location";
	cachedAt?: Date;
}) {
	const { isOffline } = useNetworkStatus();

	if (!isOffline) {
		return null;
	}

	const dataLabels = {
		route: "route",
		weather: "weather data",
		location: "location",
	};

	const formattedTime = cachedAt
		? formatRelativeTime(cachedAt)
		: "some time ago";

	return (
		<Animated.View entering={FadeIn.duration(200)} style={styles.dataIndicator}>
			<Icon name="clock" size={12} color="#a1a1aa" />
			<Text style={styles.dataIndicatorText}>
				Using cached {dataLabels[dataType]} from {formattedTime}
			</Text>
		</Animated.View>
	);
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "yesterday";
	return `${diffDays} days ago`;
}

const styles = StyleSheet.create({
	// Banner style
	banner: {
		backgroundColor: "#dc2626",
		paddingHorizontal: 16,
		paddingBottom: 12,
		alignItems: "center",
		gap: 4,
	},
	bannerText: {
		fontSize: 14,
		fontFamily: "Inter_600SemiBold",
		color: "#fafafa",
	},
	subtext: {
		fontSize: 12,
		fontFamily: "Inter_400Regular",
		color: "rgba(250, 250, 250, 0.8)",
	},

	// Badge style
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(220, 38, 38, 0.9)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	badgeText: {
		fontSize: 11,
		fontFamily: "Inter_500Medium",
		color: "#fafafa",
	},

	// Data indicator
	dataIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingVertical: 6,
		paddingHorizontal: 10,
		backgroundColor: "rgba(161, 161, 170, 0.1)",
		borderRadius: 8,
	},
	dataIndicatorText: {
		fontSize: 11,
		fontFamily: "Inter_400Regular",
		color: "#a1a1aa",
	},
});
