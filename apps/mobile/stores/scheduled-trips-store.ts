// apps/native/stores/scheduled-trips-store.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TripRecommendation = {
	status: "safe" | "caution" | "delay" | "danger";
	message: string;
	details?: string;
	suggestedDelay?: number; // minutes to delay
	stopAtKm?: number; // km where to stop if needed
};

export type ScheduledTrip = {
	id: string;
	routeId: string;
	routeName: string;
	originName: string;
	destinationName: string;
	originCoordinates: { latitude: number; longitude: number };
	destinationCoordinates: { latitude: number; longitude: number };
	departureTime: string; // ISO string
	notifyHoursBefore: number; // how many hours before to start notifications
	notifyFrequencyHours: number; // frequency of notifications (1, 2, or 3 hours)
	createdAt: string;
	lastNotificationAt?: string;
	recommendation?: TripRecommendation;
	isActive: boolean;
};

interface ScheduledTripsState {
	trips: ScheduledTrip[];

	// Actions
	addTrip: (
		trip: Omit<ScheduledTrip, "id" | "createdAt" | "isActive">,
	) => string;
	removeTrip: (tripId: string) => void;
	updateTripRecommendation: (
		tripId: string,
		recommendation: TripRecommendation,
	) => void;
	markNotificationSent: (tripId: string) => void;
	deactivateTrip: (tripId: string) => void;
	cleanupPastTrips: () => void;

	// Getters
	getUpcomingTrips: () => ScheduledTrip[];
	getTripsByRouteId: (routeId: string) => ScheduledTrip[];
	getNextTrip: () => ScheduledTrip | null;
	shouldNotify: (tripId: string) => boolean;
}

export const useScheduledTripsStore = create<ScheduledTripsState>()(
	persist(
		(set, get) => ({
			trips: [],

			addTrip: (tripData) => {
				const id = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				const newTrip: ScheduledTrip = {
					...tripData,
					id,
					createdAt: new Date().toISOString(),
					isActive: true,
				};

				set((state) => ({
					trips: [...state.trips, newTrip],
				}));

				return id;
			},

			removeTrip: (tripId) => {
				set((state) => ({
					trips: state.trips.filter((t) => t.id !== tripId),
				}));
			},

			updateTripRecommendation: (tripId, recommendation) => {
				set((state) => ({
					trips: state.trips.map((t) =>
						t.id === tripId ? { ...t, recommendation } : t,
					),
				}));
			},

			markNotificationSent: (tripId) => {
				set((state) => ({
					trips: state.trips.map((t) =>
						t.id === tripId
							? { ...t, lastNotificationAt: new Date().toISOString() }
							: t,
					),
				}));
			},

			deactivateTrip: (tripId) => {
				set((state) => ({
					trips: state.trips.map((t) =>
						t.id === tripId ? { ...t, isActive: false } : t,
					),
				}));
			},

			cleanupPastTrips: () => {
				const now = new Date();
				set((state) => ({
					trips: state.trips.filter((t) => {
						const departure = new Date(t.departureTime);
						// Keep trips that are in the future or less than 24h in the past
						const hoursSinceDeparture =
							(now.getTime() - departure.getTime()) / (1000 * 60 * 60);
						return hoursSinceDeparture < 24;
					}),
				}));
			},

			getUpcomingTrips: () => {
				const now = new Date();
				return get()
					.trips.filter((t) => t.isActive && new Date(t.departureTime) > now)
					.sort(
						(a, b) =>
							new Date(a.departureTime).getTime() -
							new Date(b.departureTime).getTime(),
					);
			},

			getTripsByRouteId: (routeId) => {
				return get().trips.filter((t) => t.routeId === routeId && t.isActive);
			},

			getNextTrip: () => {
				const upcoming = get().getUpcomingTrips();
				return upcoming.length > 0 ? upcoming[0] : null;
			},

			shouldNotify: (tripId) => {
				const trip = get().trips.find((t) => t.id === tripId);
				if (!trip || !trip.isActive) return false;

				const now = new Date();
				const departure = new Date(trip.departureTime);
				const hoursUntilDeparture =
					(departure.getTime() - now.getTime()) / (1000 * 60 * 60);

				// Don't notify if departure is too far or already passed
				if (
					hoursUntilDeparture > trip.notifyHoursBefore ||
					hoursUntilDeparture < 0
				) {
					return false;
				}

				// Check if enough time has passed since last notification
				if (trip.lastNotificationAt) {
					const lastNotification = new Date(trip.lastNotificationAt);
					const hoursSinceLastNotification =
						(now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60);
					return hoursSinceLastNotification >= trip.notifyFrequencyHours;
				}

				return true;
			},
		}),
		{
			name: "driwet-scheduled-trips",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);

// Helper function to generate recommendation based on weather conditions
export function generateRecommendation(
	alerts: Array<{
		severity: "extreme" | "severe" | "moderate" | "minor";
		kmRange?: string;
	}>,
	routeDistanceKm: number,
): TripRecommendation {
	if (alerts.length === 0) {
		return {
			status: "safe",
			message: "Ruta despejada",
			details: "No hay alertas meteorológicas en tu ruta",
		};
	}

	const hasExtreme = alerts.some((a) => a.severity === "extreme");
	const hasSevere = alerts.some((a) => a.severity === "severe");
	const hasModerate = alerts.some((a) => a.severity === "moderate");

	// Count severe+ alerts to estimate coverage
	const severeCount = alerts.filter(
		(a) => a.severity === "extreme" || a.severity === "severe",
	).length;

	if (hasExtreme || severeCount >= 2) {
		return {
			status: "danger",
			message: "No salgas - Peligro",
			details:
				"Condiciones meteorológicas extremas en la ruta. Reprogramá tu viaje.",
		};
	}

	if (hasSevere) {
		const severeAlert = alerts.find((a) => a.severity === "severe");
		return {
			status: "delay",
			message: "Salí más tarde",
			details: `Tormenta severa detectada${severeAlert?.kmRange ? ` en ${severeAlert.kmRange}` : ""}. Esperá a que pase.`,
			suggestedDelay: 60, // Suggest 1 hour delay
		};
	}

	if (hasModerate) {
		return {
			status: "caution",
			message: "Precaución en la ruta",
			details:
				"Condiciones moderadas. Reducí la velocidad y mantené distancia.",
		};
	}

	return {
		status: "safe",
		message: "Ruta con alertas menores",
		details: "Alertas menores en la ruta. Conducí con precaución.",
	};
}
