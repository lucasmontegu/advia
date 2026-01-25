// apps/mobile/services/background-location.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { scheduleWeatherAlertNotification } from "@/hooks/use-notifications";

// ============ Constants ============

export const BACKGROUND_LOCATION_TASK = "driwet-background-location";
const LOCATION_STORAGE_KEY = "@driwet/last_location";
const ACTIVE_ROUTE_KEY = "@driwet/active_route";
const LAST_ALERT_CHECK_KEY = "@driwet/last_alert_check";

// Minimum time between weather checks (5 minutes)
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Distance threshold to consider user is on route (meters)
const ON_ROUTE_THRESHOLD_M = 500;

// ============ Types ============

export interface ActiveRoute {
	id: string;
	name: string;
	origin: { lat: number; lng: number; name: string };
	destination: { lat: number; lng: number; name: string };
	waypoints: Array<{ lat: number; lng: number; km: number }>;
	startedAt: string;
}

interface LocationTaskData {
	locations: Location.LocationObject[];
}

interface StoredLocation {
	latitude: number;
	longitude: number;
	timestamp: number;
	speed: number | null;
}

// ============ Task Definition ============

TaskManager.defineTask(
	BACKGROUND_LOCATION_TASK,
	async ({
		data,
		error,
	}: {
		data: unknown;
		error: TaskManager.TaskManagerError | null;
	}) => {
		if (error) {
			console.error("Background location task error:", error);
			return;
		}

		const locationData = data as LocationTaskData;
		if (!locationData.locations || locationData.locations.length === 0) {
			return;
		}

		const location = locationData.locations[0];
		const coords = location.coords;

		// Store last known location
		const storedLocation: StoredLocation = {
			latitude: coords.latitude,
			longitude: coords.longitude,
			timestamp: location.timestamp,
			speed: coords.speed,
		};
		await AsyncStorage.setItem(
			LOCATION_STORAGE_KEY,
			JSON.stringify(storedLocation),
		);

		// Check if user is on an active route
		const activeRouteJson = await AsyncStorage.getItem(ACTIVE_ROUTE_KEY);
		if (!activeRouteJson) {
			return; // No active route, no need to check weather
		}

		let activeRoute: ActiveRoute;
		try {
			activeRoute = JSON.parse(activeRouteJson);
		} catch (error) {
			console.error("[Security] Failed to parse active route JSON:", error);
			// Clear corrupted data
			await AsyncStorage.removeItem(ACTIVE_ROUTE_KEY);
			return;
		}

		// Check if enough time has passed since last alert check
		const lastCheckJson = await AsyncStorage.getItem(LAST_ALERT_CHECK_KEY);
		const lastCheck = lastCheckJson ? Number.parseInt(lastCheckJson, 10) : 0;
		const now = Date.now();

		if (now - lastCheck < MIN_CHECK_INTERVAL_MS) {
			return; // Too soon to check again
		}

		// Check if user is on the route
		const isOnRoute = activeRoute.waypoints.some((wp) => {
			const distance = calculateDistance(
				coords.latitude,
				coords.longitude,
				wp.lat,
				wp.lng,
			);
			return distance * 1000 < ON_ROUTE_THRESHOLD_M; // Convert km to m
		});

		if (!isOnRoute) {
			return; // User is not on route
		}

		// Update last check time
		await AsyncStorage.setItem(LAST_ALERT_CHECK_KEY, now.toString());

		// Check weather along remaining route
		// NOTE: This makes an API call - ensure your backend supports it
		try {
			await checkRouteWeatherAndAlert(
				activeRoute,
				coords.latitude,
				coords.longitude,
			);
		} catch (err) {
			console.error("Failed to check route weather:", err);
		}
	},
);

// ============ Helper Functions ============

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Check weather along remaining route and send alert if needed
 */
async function checkRouteWeatherAndAlert(
	route: ActiveRoute,
	currentLat: number,
	currentLng: number,
): Promise<void> {
	// Find remaining waypoints (ahead of current position)
	const remainingWaypoints = route.waypoints.filter((wp) => {
		const distance = calculateDistance(currentLat, currentLng, wp.lat, wp.lng);
		return distance > 0.5; // More than 500m ahead
	});

	if (remainingWaypoints.length === 0) {
		return; // Approaching destination, no need to check
	}

	// Sample a few points along remaining route for weather check
	const samplePoints = remainingWaypoints.filter(
		(_, i) => i % 5 === 0 || i === remainingWaypoints.length - 1,
	);

	// TODO: Make actual API call to check weather at these points
	// For now, this is a placeholder that would integrate with your weather service
	// const weatherData = await api.weather.checkPoints({ points: samplePoints });

	// Placeholder: In production, you'd call your weather API here
	// If severe weather is detected, send notification:

	// Example of how to send an alert when weather is detected:
	/*
  if (weatherData.hasSevereWeather) {
    const alert = weatherData.alerts[0];
    const distanceToWeather = calculateDistance(currentLat, currentLng, alert.latitude, alert.longitude);
    const avgSpeed = 60; // km/h assumption
    const minutesToImpact = Math.round((distanceToWeather / avgSpeed) * 60);

    if (minutesToImpact <= 30 && minutesToImpact >= 5) {
      await scheduleWeatherAlertNotification({
        alertId: alert.id,
        severity: alert.severity,
        title: `⚠️ ${alert.type} en tu ruta`,
        body: `Clima severo detectado a ${minutesToImpact} minutos de tu ubicación actual`,
        latitude: alert.latitude,
        longitude: alert.longitude,
      });
    }
  }
  */
}

// ============ Public API ============

/**
 * Start background location tracking
 */
export async function startBackgroundLocation(): Promise<boolean> {
	try {
		// Check if background permissions are granted
		const { status: bgStatus } =
			await Location.requestBackgroundPermissionsAsync();
		if (bgStatus !== "granted") {
			console.warn("Background location permission not granted");
			return false;
		}

		// Check if task is already running
		const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(
			BACKGROUND_LOCATION_TASK,
		);
		if (isTaskRunning) {
			return true;
		}

		// Start background location updates
		await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
			accuracy: Location.Accuracy.Balanced,
			timeInterval: 60000, // Update every 60 seconds
			distanceInterval: 100, // Or every 100 meters
			foregroundService: {
				notificationTitle: "Driwet",
				notificationBody: "Monitoreando el clima en tu ruta",
				notificationColor: "#4338CA",
			},
			// iOS specific
			activityType: Location.ActivityType.AutomotiveNavigation,
			showsBackgroundLocationIndicator: true,
			pausesUpdatesAutomatically: false,
		});

		return true;
	} catch (error) {
		console.error("Failed to start background location:", error);
		return false;
	}
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundLocation(): Promise<void> {
	try {
		const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(
			BACKGROUND_LOCATION_TASK,
		);
		if (isTaskRunning) {
			await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
		}
	} catch (error) {
		console.error("Failed to stop background location:", error);
	}
}

/**
 * Check if background location is running
 */
export async function isBackgroundLocationRunning(): Promise<boolean> {
	try {
		return await Location.hasStartedLocationUpdatesAsync(
			BACKGROUND_LOCATION_TASK,
		);
	} catch {
		return false;
	}
}

/**
 * Set the active route for monitoring
 */
export async function setActiveRoute(route: ActiveRoute): Promise<void> {
	await AsyncStorage.setItem(ACTIVE_ROUTE_KEY, JSON.stringify(route));
}

/**
 * Clear the active route
 */
export async function clearActiveRoute(): Promise<void> {
	await AsyncStorage.removeItem(ACTIVE_ROUTE_KEY);
	await AsyncStorage.removeItem(LAST_ALERT_CHECK_KEY);
}

/**
 * Get the active route
 */
export async function getActiveRoute(): Promise<ActiveRoute | null> {
	const json = await AsyncStorage.getItem(ACTIVE_ROUTE_KEY);
	if (!json) return null;

	try {
		return JSON.parse(json);
	} catch (error) {
		console.error("[Security] Failed to parse active route JSON:", error);
		// Clear corrupted data
		await AsyncStorage.removeItem(ACTIVE_ROUTE_KEY);
		return null;
	}
}

/**
 * Get last known location from background task
 */
export async function getLastBackgroundLocation(): Promise<StoredLocation | null> {
	const json = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
	if (!json) return null;

	try {
		return JSON.parse(json);
	} catch (error) {
		console.error("[Security] Failed to parse stored location JSON:", error);
		// Clear corrupted data
		await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
		return null;
	}
}
