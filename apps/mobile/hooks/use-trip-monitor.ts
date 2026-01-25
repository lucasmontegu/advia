// apps/mobile/hooks/use-trip-monitor.ts
import { useCallback, useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
	type ActiveRoute,
	clearActiveRoute,
	getActiveRoute,
	isBackgroundLocationRunning,
	setActiveRoute,
	startBackgroundLocation,
	stopBackgroundLocation,
} from "@/services/background-location";

// ============ Types ============

interface TripMonitorState {
	isMonitoring: boolean;
	activeRoute: ActiveRoute | null;
	isLoading: boolean;
	error: string | null;
}

interface StartTripParams {
	routeId: string;
	routeName: string;
	origin: { lat: number; lng: number; name: string };
	destination: { lat: number; lng: number; name: string };
	waypoints: Array<{ lat: number; lng: number; km: number }>;
}

// ============ Hook ============

/**
 * Hook for managing trip monitoring with background location
 *
 * Usage:
 * ```tsx
 * const { isMonitoring, activeRoute, startTrip, endTrip } = useTripMonitor();
 *
 * // Start monitoring a route
 * await startTrip({
 *   routeId: 'route-123',
 *   routeName: 'Home to Work',
 *   origin: { lat: -34.6, lng: -58.4, name: 'Home' },
 *   destination: { lat: -34.5, lng: -58.5, name: 'Work' },
 *   waypoints: [...],
 * });
 *
 * // End monitoring
 * await endTrip();
 * ```
 */
export function useTripMonitor() {
	const [state, setState] = useState<TripMonitorState>({
		isMonitoring: false,
		activeRoute: null,
		isLoading: true,
		error: null,
	});

	// Check current state on mount
	useEffect(() => {
		let isMounted = true;

		const checkState = async () => {
			try {
				const [running, route] = await Promise.all([
					isBackgroundLocationRunning(),
					getActiveRoute(),
				]);

				if (isMounted) {
					setState({
						isMonitoring: running,
						activeRoute: route,
						isLoading: false,
						error: null,
					});
				}
			} catch (error) {
				if (isMounted) {
					setState((prev) => ({
						...prev,
						isLoading: false,
						error:
							error instanceof Error
								? error.message
								: "Error checking trip state",
					}));
				}
			}
		};

		checkState();

		// Re-check when app comes to foreground
		const subscription = AppState.addEventListener(
			"change",
			(nextState: AppStateStatus) => {
				if (nextState === "active") {
					checkState();
				}
			},
		);

		return () => {
			isMounted = false;
			subscription.remove();
		};
	}, []);

	// Start monitoring a trip
	const startTrip = useCallback(
		async (params: StartTripParams): Promise<boolean> => {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				// Create active route object
				const route: ActiveRoute = {
					id: params.routeId,
					name: params.routeName,
					origin: params.origin,
					destination: params.destination,
					waypoints: params.waypoints,
					startedAt: new Date().toISOString(),
				};

				// Save active route
				await setActiveRoute(route);

				// Start background location tracking
				const started = await startBackgroundLocation();

				if (!started) {
					await clearActiveRoute();
					setState((prev) => ({
						...prev,
						isLoading: false,
						error: "No se pudo iniciar el seguimiento de ubicación",
					}));
					return false;
				}

				setState({
					isMonitoring: true,
					activeRoute: route,
					isLoading: false,
					error: null,
				});

				return true;
			} catch (error) {
				await clearActiveRoute();
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: error instanceof Error ? error.message : "Error starting trip",
				}));
				return false;
			}
		},
		[],
	);

	// End the current trip
	const endTrip = useCallback(async (): Promise<void> => {
		setState((prev) => ({ ...prev, isLoading: true }));

		try {
			await Promise.all([stopBackgroundLocation(), clearActiveRoute()]);

			setState({
				isMonitoring: false,
				activeRoute: null,
				isLoading: false,
				error: null,
			});
		} catch (error) {
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: error instanceof Error ? error.message : "Error ending trip",
			}));
		}
	}, []);

	// Pause monitoring (keep route but stop location updates)
	const pauseMonitoring = useCallback(async (): Promise<void> => {
		try {
			await stopBackgroundLocation();
			setState((prev) => ({ ...prev, isMonitoring: false }));
		} catch (error) {
			console.error("Failed to pause monitoring:", error);
		}
	}, []);

	// Resume monitoring for current route
	const resumeMonitoring = useCallback(async (): Promise<boolean> => {
		if (!state.activeRoute) {
			return false;
		}

		try {
			const started = await startBackgroundLocation();
			if (started) {
				setState((prev) => ({ ...prev, isMonitoring: true }));
			}
			return started;
		} catch (error) {
			console.error("Failed to resume monitoring:", error);
			return false;
		}
	}, [state.activeRoute]);

	return {
		...state,
		startTrip,
		endTrip,
		pauseMonitoring,
		resumeMonitoring,
	};
}

/**
 * Simple hook to check if a trip is active
 */
export function useIsTripActive(): boolean {
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		getActiveRoute().then((route) => setIsActive(!!route));
	}, []);

	return isActive;
}
