import * as Speech from "expo-speech";
import { useCallback, useRef, useState } from "react";
import type {
	NavigationCoordinate,
	NavigationWaypoint,
	RouteProgress,
} from "@/components/navigation/navigation-view";

// Location type for user position updates
export type NavigationLocation = {
	latitude: number;
	longitude: number;
	bearing: number;
	speed: number; // m/s
};

export type NavigationState =
	| "idle"
	| "ready"
	| "navigating"
	| "paused"
	| "arrived"
	| "error";

export type NavigationConfig = {
	origin: NavigationCoordinate;
	destination: NavigationCoordinate;
	waypoints?: NavigationWaypoint[];
	simulateRoute?: boolean;
	language?: string;
};

export type WeatherAlert = {
	type: "rain" | "hail" | "storm" | "wind" | "fog";
	severity: "low" | "medium" | "high" | "extreme";
	message: string;
	distanceAhead?: number; // km
	suggestedAction?: "continue" | "slow_down" | "find_shelter" | "reroute";
};

export function useNavigation() {
	const [state, setState] = useState<NavigationState>("idle");
	const [config, setConfig] = useState<NavigationConfig | null>(null);
	const [progress, setProgress] = useState<RouteProgress | null>(null);
	const [location, setLocation] = useState<NavigationLocation | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [activeWeatherAlerts, setActiveWeatherAlerts] = useState<
		WeatherAlert[]
	>([]);

	const lastAnnouncementRef = useRef<string>("");
	const announcementCooldownRef = useRef<number>(0);

	// Speak navigation/weather announcements
	const speak = useCallback(
		async (
			message: string,
			options?: { force?: boolean; language?: string },
		) => {
			if (isMuted && !options?.force) return;

			// Avoid repeating the same announcement within cooldown
			const now = Date.now();
			if (
				message === lastAnnouncementRef.current &&
				now - announcementCooldownRef.current < 30000
			) {
				return;
			}

			try {
				// Stop any ongoing speech
				await Speech.stop();

				await Speech.speak(message, {
					language: options?.language || config?.language || "es-ES",
					rate: 0.9,
					pitch: 1.0,
					onDone: () => {
						console.log("[Navigation] Speech completed:", message);
					},
					onError: (err) => {
						console.error("[Navigation] Speech error:", err);
					},
				});

				lastAnnouncementRef.current = message;
				announcementCooldownRef.current = now;
			} catch (err) {
				console.error("[Navigation] Failed to speak:", err);
			}
		},
		[isMuted, config?.language],
	);

	// Start navigation
	const startNavigation = useCallback((navigationConfig: NavigationConfig) => {
		setConfig(navigationConfig);
		setState("ready");
		setError(null);
		setProgress(null);
		setActiveWeatherAlerts([]);
	}, []);

	// Stop navigation
	const stopNavigation = useCallback(() => {
		Speech.stop();
		setState("idle");
		setConfig(null);
		setProgress(null);
		setLocation(null);
		setError(null);
		setActiveWeatherAlerts([]);
	}, []);

	// Pause navigation
	const pauseNavigation = useCallback(() => {
		setState("paused");
	}, []);

	// Resume navigation
	const resumeNavigation = useCallback(() => {
		if (config) {
			setState("navigating");
		}
	}, [config]);

	// Toggle mute
	const toggleMute = useCallback(() => {
		setIsMuted((prev) => !prev);
	}, []);

	// Handle route progress updates
	const handleRouteProgress = useCallback(
		(newProgress: RouteProgress) => {
			setProgress(newProgress);
			if (state !== "navigating") {
				setState("navigating");
			}
		},
		[state],
	);

	// Handle location updates
	const handleLocationChange = useCallback(
		(newLocation: NavigationLocation) => {
			setLocation(newLocation);
		},
		[],
	);

	// Handle arrival
	const handleArrival = useCallback(() => {
		setState("arrived");
		speak("Has llegado a tu destino.", { force: true });
	}, [speak]);

	// Handle cancellation
	const handleCancelNavigation = useCallback(() => {
		stopNavigation();
	}, [stopNavigation]);

	// Handle errors
	const handleError = useCallback((errorMessage: string) => {
		setError(errorMessage);
		setState("error");
	}, []);

	// Handle route ready
	const handleRouteReady = useCallback(() => {
		speak("Ruta calculada. Iniciando navegación.");
		setState("navigating");
	}, [speak]);

	// Add weather alert
	const addWeatherAlert = useCallback(
		(alert: WeatherAlert) => {
			setActiveWeatherAlerts((prev) => {
				// Avoid duplicates
				if (
					prev.some(
						(a) => a.type === alert.type && a.severity === alert.severity,
					)
				) {
					return prev;
				}
				return [...prev, alert];
			});

			// Announce weather alert
			speak(alert.message, {
				force: alert.severity === "extreme" || alert.severity === "high",
			});
		},
		[speak],
	);

	// Clear weather alerts
	const clearWeatherAlerts = useCallback(() => {
		setActiveWeatherAlerts([]);
	}, []);

	// Formatted ETA string
	const getFormattedETA = useCallback(() => {
		if (!progress) return null;

		const minutes = Math.ceil(progress.durationRemaining / 60);
		if (minutes < 60) {
			return `${minutes} min`;
		}
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}min`;
	}, [progress]);

	// Formatted distance remaining
	const getFormattedDistance = useCallback(() => {
		if (!progress) return null;

		const km = progress.distanceRemaining / 1000;
		if (km < 1) {
			return `${Math.round(progress.distanceRemaining)} m`;
		}
		return `${km.toFixed(1)} km`;
	}, [progress]);

	return {
		// State
		state,
		config,
		progress,
		location,
		error,
		isMuted,
		activeWeatherAlerts,

		// Actions
		startNavigation,
		stopNavigation,
		pauseNavigation,
		resumeNavigation,
		toggleMute,
		speak,
		addWeatherAlert,
		clearWeatherAlerts,

		// Callbacks for NavigationView
		handleRouteProgress,
		handleLocationChange,
		handleArrival,
		handleCancelNavigation,
		handleError,
		handleRouteReady,

		// Helpers
		getFormattedETA,
		getFormattedDistance,
	};
}
