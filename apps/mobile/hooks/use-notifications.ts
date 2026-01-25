// apps/mobile/hooks/use-notifications.ts

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

// ============ Types ============

export type NotificationPermissionStatus =
	| "granted"
	| "denied"
	| "undetermined";

export interface PushTokenResult {
	token: string | null;
	error: string | null;
}

export interface WeatherAlertNotification {
	type: "weather_alert";
	alertId: string;
	severity: "minor" | "moderate" | "severe" | "extreme";
	title: string;
	body: string;
	latitude?: number;
	longitude?: number;
}

export interface ShelterNotification {
	type: "shelter_suggestion";
	shelterName: string;
	distanceKm: number;
	latitude: number;
	longitude: number;
}

export type NotificationData =
	| WeatherAlertNotification
	| ShelterNotification
	| { [key: string]: unknown };

// ============ Configuration ============

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
	handleNotification: async (notification) => {
		const data = notification.request.content.data as NotificationData;
		const isUrgent =
			data &&
			"severity" in data &&
			(data.severity === "severe" || data.severity === "extreme");

		return {
			shouldShowAlert: true,
			shouldPlaySound: isUrgent,
			shouldSetBadge: true,
			shouldShowBanner: true,
			shouldShowList: true,
		};
	},
});

// ============ Hooks ============

/**
 * Main hook for managing push notifications
 */
export function useNotifications() {
	const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
	const [permissionStatus, setPermissionStatus] =
		useState<NotificationPermissionStatus>("undetermined");
	const [notification, setNotification] =
		useState<Notifications.Notification | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const notificationListener = useRef<Notifications.EventSubscription | null>(
		null,
	);
	const responseListener = useRef<Notifications.EventSubscription | null>(null);
	const appState = useRef(AppState.currentState);

	// Check and update permission status
	const checkPermissionStatus = useCallback(async () => {
		const { status } = await Notifications.getPermissionsAsync();
		setPermissionStatus(status as NotificationPermissionStatus);
		return status;
	}, []);

	// Request push notification permissions
	const requestPermissions = useCallback(async (): Promise<boolean> => {
		if (!Device.isDevice) {
			console.warn("Push notifications only work on physical devices");
			return false;
		}

		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		setPermissionStatus(finalStatus as NotificationPermissionStatus);
		return finalStatus === "granted";
	}, []);

	// Register for push notifications and get token
	const registerForPushNotifications =
		useCallback(async (): Promise<PushTokenResult> => {
			if (!Device.isDevice) {
				return {
					token: null,
					error: "Push notifications only work on physical devices",
				};
			}

			const granted = await requestPermissions();
			if (!granted) {
				return { token: null, error: "Permission not granted" };
			}

			try {
				// Get project ID for Expo notifications
				const projectId = Constants.expoConfig?.extra?.eas?.projectId;
				if (!projectId) {
					return { token: null, error: "Project ID not configured" };
				}

				const tokenData = await Notifications.getExpoPushTokenAsync({
					projectId,
				});

				const token = tokenData.data;
				setExpoPushToken(token);

				// Configure Android channel
				if (Platform.OS === "android") {
					await Notifications.setNotificationChannelAsync("weather-alerts", {
						name: "Alertas de clima",
						description: "Notificaciones de alertas meteorológicas",
						importance: Notifications.AndroidImportance.MAX,
						vibrationPattern: [0, 250, 250, 250],
						lightColor: "#DC2626",
						sound: "default",
						enableVibrate: true,
						enableLights: true,
						showBadge: true,
					});

					await Notifications.setNotificationChannelAsync("route-updates", {
						name: "Actualizaciones de ruta",
						description: "Notificaciones sobre el clima en tu ruta",
						importance: Notifications.AndroidImportance.HIGH,
						vibrationPattern: [0, 250],
						lightColor: "#4338CA",
						sound: "default",
					});
				}

				return { token, error: null };
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				return { token: null, error: message };
			}
		}, [requestPermissions]);

	// Initialize notifications on mount
	useEffect(() => {
		let isMounted = true;

		const init = async () => {
			await checkPermissionStatus();

			// Only try to register if on device
			if (Device.isDevice) {
				const result = await registerForPushNotifications();
				if (isMounted && result.token) {
					setExpoPushToken(result.token);
				}
			}

			if (isMounted) {
				setIsLoading(false);
			}
		};

		init();

		// Listen for incoming notifications while app is foregrounded
		notificationListener.current =
			Notifications.addNotificationReceivedListener((notification) => {
				if (isMounted) {
					setNotification(notification);
				}
			});

		// Listen for notification interactions (user tapped notification)
		responseListener.current =
			Notifications.addNotificationResponseReceivedListener((response) => {
				const data = response.notification.request.content
					.data as NotificationData;
				// Handle notification tap - this will be handled by NotificationContext
				console.log("Notification tapped:", data);
			});

		// Re-check permissions when app comes to foreground
		const subscription = AppState.addEventListener(
			"change",
			(nextAppState: AppStateStatus) => {
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === "active"
				) {
					checkPermissionStatus();
				}
				appState.current = nextAppState;
			},
		);

		return () => {
			isMounted = false;
			notificationListener.current?.remove();
			responseListener.current?.remove();
			subscription.remove();
		};
	}, [checkPermissionStatus, registerForPushNotifications]);

	return {
		expoPushToken,
		permissionStatus,
		notification,
		isLoading,
		requestPermissions,
		registerForPushNotifications,
		checkPermissionStatus,
	};
}

/**
 * Hook for notification response handling (when user taps a notification)
 */
export function useNotificationResponse(
	onResponse: (data: NotificationData, actionId?: string) => void,
) {
	useEffect(() => {
		const subscription = Notifications.addNotificationResponseReceivedListener(
			(response) => {
				const data = response.notification.request.content
					.data as NotificationData;
				const actionId = response.actionIdentifier;
				onResponse(data, actionId);
			},
		);

		// Check for notification that opened the app
		Notifications.getLastNotificationResponseAsync().then((response) => {
			if (response) {
				const data = response.notification.request.content
					.data as NotificationData;
				const actionId = response.actionIdentifier;
				onResponse(data, actionId);
			}
		});

		return () => {
			subscription.remove();
		};
	}, [onResponse]);
}

// ============ Utility Functions ============

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
	title: string,
	body: string,
	data: NotificationData,
	options: {
		seconds?: number;
		channelId?: string;
		priority?: "default" | "high" | "max";
	} = {},
): Promise<string> {
	const {
		seconds = 1,
		channelId = "weather-alerts",
		priority = "high",
	} = options;

	const priorityMap = {
		default: Notifications.AndroidNotificationPriority.DEFAULT,
		high: Notifications.AndroidNotificationPriority.HIGH,
		max: Notifications.AndroidNotificationPriority.MAX,
	};

	return await Notifications.scheduleNotificationAsync({
		content: {
			title,
			body,
			data: data as Record<string, unknown>,
			sound: "default",
			priority: priorityMap[priority],
		},
		trigger:
			Platform.OS === "android"
				? {
						type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
						seconds,
						channelId,
					}
				: {
						type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
						seconds,
					},
	});
}

/**
 * Schedule a weather alert notification
 */
export async function scheduleWeatherAlertNotification(
	alert: Omit<WeatherAlertNotification, "type">,
): Promise<string> {
	const priorityMap = {
		minor: "default" as const,
		moderate: "default" as const,
		severe: "high" as const,
		extreme: "max" as const,
	};

	return scheduleLocalNotification(
		alert.title,
		alert.body,
		{ type: "weather_alert", ...alert },
		{
			priority: priorityMap[alert.severity],
			channelId: "weather-alerts",
		},
	);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
	await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel a specific notification
 */
export async function cancelNotification(
	notificationId: string,
): Promise<void> {
	await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
	return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
	await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications from notification center
 */
export async function dismissAllNotifications(): Promise<void> {
	await Notifications.dismissAllNotificationsAsync();
}
