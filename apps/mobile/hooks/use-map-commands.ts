// apps/mobile/hooks/use-map-commands.ts
/**
 * State management for chat-to-map commands.
 * When the AI uses tools like showRouteWeather or findSafePlaces,
 * this hook processes those commands and updates the map state.
 */

import { create } from "zustand";
import { api } from "@/lib/query-client";
import type { RouteWeatherSegment } from "./use-route-weather";
import type { SafePlace } from "./use-safe-places";
import { navigateToPlace } from "./use-safe-places";

// ============ Types ============

export type MapCommand =
	| { type: "showAlert"; payload: ShowAlertPayload }
	| { type: "showRouteWeather"; payload: ShowRouteWeatherPayload }
	| { type: "findSafePlaces"; payload: FindSafePlacesPayload }
	| { type: "navigateToShelter"; payload: NavigateToShelterPayload }
	| { type: "requestLocation"; payload: RequestLocationPayload }
	| { type: "clearRoute" }
	| { type: "clearSafePlaces" };

type ShowAlertPayload = {
	alertId: string;
	alertType: string;
	severity: string;
	center: { latitude: number; longitude: number };
	zoom: number;
};

type ShowRouteWeatherPayload = {
	origin: { lat: number; lng: number; name?: string };
	destination: { lat: number; lng: number; name?: string };
};

type FindSafePlacesPayload = {
	location: { lat: number; lng: number };
	radiusKm: number;
	urgency: "low" | "medium" | "high";
};

type NavigateToShelterPayload = {
	shelter: {
		name: string;
		lat: number;
		lng: number;
		type: string;
	};
};

type RequestLocationPayload = {
	reason: string;
};

// ============ Map State Store ============

interface MapCommandState {
	// Route display state
	routeSegments: RouteWeatherSegment[];
	destination: { latitude: number; longitude: number } | null;
	overallRisk: "low" | "moderate" | "high" | "extreme" | null;
	isLoadingRoute: boolean;

	// Safe places state
	safePlaces: SafePlace[];
	isLoadingSafePlaces: boolean;
	safePlacesUrgency: "low" | "medium" | "high" | null;

	// Alert focus state
	focusedAlertId: string | null;
	focusedAlertCenter: { latitude: number; longitude: number } | null;

	// Location request state
	locationRequestReason: string | null;

	// Actions
	processCommand: (command: MapCommand) => Promise<void>;
	clearRoute: () => void;
	clearSafePlaces: () => void;
	clearLocationRequest: () => void;
	reset: () => void;
}

export const useMapCommandStore = create<MapCommandState>((set, get) => ({
	// Initial state
	routeSegments: [],
	destination: null,
	overallRisk: null,
	isLoadingRoute: false,
	safePlaces: [],
	isLoadingSafePlaces: false,
	safePlacesUrgency: null,
	focusedAlertId: null,
	focusedAlertCenter: null,
	locationRequestReason: null,

	// Process a command from the AI chat
	processCommand: async (command: MapCommand) => {
		switch (command.type) {
			case "showAlert": {
				const { alertId, center } = command.payload;
				set({
					focusedAlertId: alertId,
					focusedAlertCenter: center,
				});
				break;
			}

			case "showRouteWeather": {
				const { origin, destination } = command.payload;
				set({ isLoadingRoute: true });

				try {
					// Call the weather API to analyze the route
					const result = await api.weather.analyzeRoute.call({
						polyline: "",
						origin: { lat: origin.lat, lng: origin.lng },
						destination: { lat: destination.lat, lng: destination.lng },
					});

					set({
						routeSegments: result.segments as RouteWeatherSegment[],
						destination: {
							latitude: destination.lat,
							longitude: destination.lng,
						},
						overallRisk: result.overallRisk as
							| "low"
							| "moderate"
							| "high"
							| "extreme",
						isLoadingRoute: false,
					});
				} catch (error) {
					console.error("Failed to analyze route weather:", error);
					set({ isLoadingRoute: false });
				}
				break;
			}

			case "findSafePlaces": {
				const { location, radiusKm, urgency } = command.payload;
				set({ isLoadingSafePlaces: true, safePlacesUrgency: urgency });

				try {
					const result = await api.places.getSafePlaces.call({
						lat: location.lat,
						lng: location.lng,
						radiusKm,
						types: ["gas_station", "rest_area", "town"],
					});

					set({
						safePlaces: result.places as SafePlace[],
						isLoadingSafePlaces: false,
					});
				} catch (error) {
					console.error("Failed to fetch safe places:", error);
					set({ isLoadingSafePlaces: false });
				}
				break;
			}

			case "navigateToShelter": {
				const { shelter } = command.payload;
				const place: SafePlace = {
					id: `shelter-${Date.now()}`,
					name: shelter.name,
					type:
						(shelter.type as "gas_station" | "rest_area" | "town") || "town",
					latitude: shelter.lat,
					longitude: shelter.lng,
				};
				await navigateToPlace(place, "waze");
				break;
			}

			case "requestLocation": {
				const { reason } = command.payload;
				set({ locationRequestReason: reason });
				break;
			}

			case "clearRoute": {
				get().clearRoute();
				break;
			}

			case "clearSafePlaces": {
				get().clearSafePlaces();
				break;
			}
		}
	},

	clearRoute: () => {
		set({
			routeSegments: [],
			destination: null,
			overallRisk: null,
		});
	},

	clearSafePlaces: () => {
		set({
			safePlaces: [],
			safePlacesUrgency: null,
		});
	},

	clearLocationRequest: () => {
		set({ locationRequestReason: null });
	},

	reset: () => {
		set({
			routeSegments: [],
			destination: null,
			overallRisk: null,
			isLoadingRoute: false,
			safePlaces: [],
			isLoadingSafePlaces: false,
			safePlacesUrgency: null,
			focusedAlertId: null,
			focusedAlertCenter: null,
			locationRequestReason: null,
		});
	},
}));

// ============ Parser for AI Tool Results ============

/**
 * Parse a tool result from the AI chat into a MapCommand.
 * This is called when we receive tool_call results in the chat stream.
 */
export function parseToolResult(
	toolName: string,
	result: unknown,
): MapCommand | null {
	if (!result || typeof result !== "object") return null;

	const data = result as Record<string, unknown>;

	// Check for action field
	const action = data.action;
	if (!action) return null;

	switch (action) {
		case "showAlert":
			return {
				type: "showAlert",
				payload: {
					alertId: data.alertId as string,
					alertType: data.alertType as string,
					severity: data.severity as string,
					center: data.center as { latitude: number; longitude: number },
					zoom: (data.zoom as number) || 10,
				},
			};

		case "showRouteWeather":
			return {
				type: "showRouteWeather",
				payload: {
					origin: data.origin as { lat: number; lng: number; name?: string },
					destination: data.destination as {
						lat: number;
						lng: number;
						name?: string;
					},
				},
			};

		case "findSafePlaces":
			return {
				type: "findSafePlaces",
				payload: {
					location: data.location as { lat: number; lng: number },
					radiusKm: (data.radiusKm as number) || 20,
					urgency: (data.urgency as "low" | "medium" | "high") || "medium",
				},
			};

		case "navigateToShelter":
			return {
				type: "navigateToShelter",
				payload: {
					shelter: data.shelter as {
						name: string;
						lat: number;
						lng: number;
						type: string;
					},
				},
			};

		case "requestLocation":
			return {
				type: "requestLocation",
				payload: {
					reason: data.reason as string,
				},
			};

		default:
			return null;
	}
}

// ============ Convenience Hook ============

/**
 * Hook that provides both the map state and the command processor
 */
export function useMapCommands() {
	const store = useMapCommandStore();

	return {
		// State
		routeSegments: store.routeSegments,
		destination: store.destination,
		overallRisk: store.overallRisk,
		isLoadingRoute: store.isLoadingRoute,
		safePlaces: store.safePlaces,
		isLoadingSafePlaces: store.isLoadingSafePlaces,
		safePlacesUrgency: store.safePlacesUrgency,
		locationRequestReason: store.locationRequestReason,

		// Actions
		processCommand: store.processCommand,
		clearRoute: store.clearRoute,
		clearSafePlaces: store.clearSafePlaces,
		clearLocationRequest: store.clearLocationRequest,
		reset: store.reset,
		parseToolResult,
	};
}
