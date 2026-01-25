// apps/mobile/contexts/notifications-context.tsx

import { type Href, useRouter } from "expo-router";
import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	type NotificationData,
	type NotificationPermissionStatus,
	type ShelterNotification,
	useNotificationResponse,
	useNotifications,
	type WeatherAlertNotification,
} from "@/hooks/use-notifications";
import { isValidId, sanitizeCoordinates } from "@/lib/url-security";

// ============ Types ============

interface NotificationsContextValue {
	// Token & permissions
	expoPushToken: string | null;
	permissionStatus: NotificationPermissionStatus;
	isLoading: boolean;

	// Permission actions
	requestPermissions: () => Promise<boolean>;
	hasPermission: boolean;
	needsPermission: boolean;

	// Notification state
	unreadCount: number;
	clearUnread: () => void;

	// Last notification that was tapped (for navigation)
	lastTappedNotification: NotificationData | null;
	clearLastTapped: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
	null,
);

// ============ Provider ============

interface NotificationsProviderProps {
	children: ReactNode;
}

export function NotificationsProvider({
	children,
}: NotificationsProviderProps) {
	const router = useRouter();
	const {
		expoPushToken,
		permissionStatus,
		isLoading,
		requestPermissions: requestPerms,
	} = useNotifications();

	const [unreadCount, setUnreadCount] = useState(0);
	const [lastTappedNotification, setLastTappedNotification] =
		useState<NotificationData | null>(null);

	const hasPermission = permissionStatus === "granted";
	const needsPermission = permissionStatus === "undetermined";

	// Handle notification tap
	const handleNotificationResponse = useCallback(
		(data: NotificationData) => {
			setLastTappedNotification(data);
			setUnreadCount((prev) => Math.max(0, prev - 1));

			// Handle navigation based on notification type
			if ("type" in data) {
				switch (data.type) {
					case "weather_alert": {
						const alertData = data as WeatherAlertNotification;
						// Validate coordinates and alertId before constructing URL
						const alertCoords = sanitizeCoordinates(
							alertData.latitude,
							alertData.longitude,
						);
						const validAlertId = isValidId(alertData.alertId)
							? alertData.alertId
							: null;

						if (alertCoords && validAlertId) {
							const mapUrl =
								`/?lat=${alertCoords.latitude}&lng=${alertCoords.longitude}&alertId=${validAlertId}` as Href;
							router.push(mapUrl);
						} else {
							// Invalid data, navigate to home
							router.push("/");
						}
						break;
					}

					case "shelter_suggestion": {
						const shelterData = data as ShelterNotification;
						// Validate coordinates before constructing URL
						const shelterCoords = sanitizeCoordinates(
							shelterData.latitude,
							shelterData.longitude,
						);

						if (shelterCoords) {
							const shelterUrl =
								`/?lat=${shelterCoords.latitude}&lng=${shelterCoords.longitude}&showShelters=true` as Href;
							router.push(shelterUrl);
						} else {
							// Invalid data, navigate to home
							router.push("/");
						}
						break;
					}

					case "scheduled_trip": {
						// Navigate to route details for scheduled trip
						const tripData = data as { tripId?: string; routeId?: string };
						// Validate routeId before using in URL
						if (tripData.routeId && isValidId(tripData.routeId)) {
							router.push(`/route-detail?id=${tripData.routeId}` as Href);
						} else {
							router.push("/routes" as Href);
						}
						break;
					}

					default:
						// Default: go to home
						router.push("/");
				}
			}
		},
		[router],
	);

	// Set up notification response listener
	useNotificationResponse(handleNotificationResponse);

	// Request permissions wrapper
	const requestPermissions = useCallback(async () => {
		return await requestPerms();
	}, [requestPerms]);

	// Clear unread count
	const clearUnread = useCallback(() => {
		setUnreadCount(0);
	}, []);

	// Clear last tapped notification
	const clearLastTapped = useCallback(() => {
		setLastTappedNotification(null);
	}, []);

	// Track incoming notifications for unread count
	useEffect(() => {
		let subscription: { remove: () => void } | null = null;
		let isMounted = true;

		// Import dynamically to avoid circular deps
		import("expo-notifications").then((Notifications) => {
			if (!isMounted) return;

			subscription = Notifications.addNotificationReceivedListener(() => {
				setUnreadCount((prev) => prev + 1);
			});
		});

		return () => {
			isMounted = false;
			subscription?.remove();
		};
	}, []);

	const value: NotificationsContextValue = {
		expoPushToken,
		permissionStatus,
		isLoading,
		requestPermissions,
		hasPermission,
		needsPermission,
		unreadCount,
		clearUnread,
		lastTappedNotification,
		clearLastTapped,
	};

	return (
		<NotificationsContext.Provider value={value}>
			{children}
		</NotificationsContext.Provider>
	);
}

// ============ Hook ============

export function useNotificationsContext() {
	const context = useContext(NotificationsContext);
	if (!context) {
		throw new Error(
			"useNotificationsContext must be used within a NotificationsProvider",
		);
	}
	return context;
}

// Export for convenience
export { NotificationsContext };
