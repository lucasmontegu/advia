// apps/mobile/hooks/use-navigation-copilot.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { RouteProgress } from "@/components/navigation/navigation-view";
import { useSendChatMessage } from "@/hooks/use-api";
import type { NavigationLocation } from "@/hooks/use-navigation";
import {
	type CopilotContext,
	generateCopilotMessage,
	type RouteWeatherSegment,
	resetCopilotState,
	type SafePlace,
	speakCopilotMessage,
} from "@/services/navigation-copilot";

export type NavigationCopilotConfig = {
	enabled?: boolean;
	language?: string;
	voiceEnabled?: boolean;
	weatherCheckIntervalMs?: number;
};

const DEFAULT_CONFIG: Required<NavigationCopilotConfig> = {
	enabled: true,
	language: "es",
	voiceEnabled: true,
	weatherCheckIntervalMs: 30000, // Check every 30 seconds
};

/**
 * Hook for weather-aware navigation copilot
 * Provides contextual voice guidance based on weather conditions along the route
 */
export function useNavigationCopilot(config: NavigationCopilotConfig = {}) {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };

	const [isActive, setIsActive] = useState(false);
	const [isMuted, setIsMuted] = useState(!mergedConfig.voiceEnabled);
	const [weatherSegments, setWeatherSegments] = useState<RouteWeatherSegment[]>(
		[],
	);
	const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [isGeneratingAIMessage, setIsGeneratingAIMessage] = useState(false);

	const locationRef = useRef<NavigationLocation | null>(null);
	const progressRef = useRef<RouteProgress | null>(null);
	const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const sendChatMessage = useSendChatMessage();

	// Start copilot monitoring
	const start = useCallback(() => {
		if (!mergedConfig.enabled) return;

		resetCopilotState();
		setIsActive(true);

		// Start periodic weather condition checks
		checkIntervalRef.current = setInterval(() => {
			checkAndAnnounce();
		}, mergedConfig.weatherCheckIntervalMs);
	}, [mergedConfig.enabled, mergedConfig.weatherCheckIntervalMs]);

	// Stop copilot
	const stop = useCallback(() => {
		setIsActive(false);
		resetCopilotState();

		if (checkIntervalRef.current) {
			clearInterval(checkIntervalRef.current);
			checkIntervalRef.current = null;
		}
	}, []);

	// Toggle mute
	const toggleMute = useCallback(() => {
		setIsMuted((prev) => !prev);
	}, []);

	// Update location from navigation
	const updateLocation = useCallback((location: NavigationLocation) => {
		locationRef.current = location;
	}, []);

	// Update progress from navigation
	const updateProgress = useCallback((progress: RouteProgress) => {
		progressRef.current = progress;
	}, []);

	// Update weather data for the route
	const updateWeatherSegments = useCallback(
		(segments: RouteWeatherSegment[]) => {
			setWeatherSegments(segments);
		},
		[],
	);

	// Update safe places data
	const updateSafePlaces = useCallback((places: SafePlace[]) => {
		setSafePlaces(places);
	}, []);

	// Check conditions and announce if needed
	const checkAndAnnounce = useCallback(async () => {
		if (!isActive || !mergedConfig.enabled) return;

		const context: CopilotContext = {
			location: locationRef.current,
			progress: progressRef.current,
			weatherSegments,
			safePlaces,
			language: mergedConfig.language,
		};

		const message = generateCopilotMessage(context);

		if (message) {
			setLastMessage(message.message);

			// For critical messages, optionally enhance with AI
			if (message.priority === "critical" && !isGeneratingAIMessage) {
				await enhanceMessageWithAI(message.message, context);
			} else if (!isMuted) {
				await speakCopilotMessage(message, {
					language: `${mergedConfig.language}-ES`,
				});
			}
		}
	}, [
		isActive,
		mergedConfig.enabled,
		mergedConfig.language,
		weatherSegments,
		safePlaces,
		isMuted,
		isGeneratingAIMessage,
	]);

	// Enhance critical messages with AI for more context
	const enhanceMessageWithAI = useCallback(
		async (baseMessage: string, context: CopilotContext) => {
			if (!context.location) return;

			setIsGeneratingAIMessage(true);

			try {
				// Use the existing chat API to generate a more helpful message
				const prompt = `El conductor está navegando y se detectó una situación importante: "${baseMessage}".
        Ubicación: ${context.location.latitude.toFixed(4)}, ${context.location.longitude.toFixed(4)}
        Velocidad: ${Math.round((context.location.speed || 0) * 3.6)} km/h
        Distancia restante: ${context.progress ? Math.round(context.progress.distanceRemaining / 1000) : "?"} km

        Genera un mensaje de voz breve (máximo 2 oraciones) que sea útil y calme al conductor, pero que también transmita la urgencia si es necesario.`;

				let aiMessage = "";
				await sendChatMessage.mutateAsync({
					message: prompt,
					location: {
						latitude: context.location.latitude,
						longitude: context.location.longitude,
					},
					onChunk: (chunk) => {
						aiMessage = chunk;
					},
				});

				if (aiMessage && !isMuted) {
					setLastMessage(aiMessage);
					await speakCopilotMessage(
						{
							type: "weather_warning",
							priority: "critical",
							message: aiMessage,
							timestamp: Date.now(),
						},
						{ language: `${mergedConfig.language}-ES`, force: true },
					);
				}
			} catch (error) {
				console.error("[NavigationCopilot] AI enhancement failed:", error);
				// Fall back to base message
				if (!isMuted) {
					await speakCopilotMessage(
						{
							type: "weather_warning",
							priority: "critical",
							message: baseMessage,
							timestamp: Date.now(),
						},
						{ language: `${mergedConfig.language}-ES` },
					);
				}
			} finally {
				setIsGeneratingAIMessage(false);
			}
		},
		[sendChatMessage, isMuted, mergedConfig.language],
	);

	// Manual announcement (for testing or user-triggered)
	const announce = useCallback(
		async (
			message: string,
			priority: "low" | "medium" | "high" | "critical" = "medium",
		) => {
			if (isMuted) return;

			setLastMessage(message);
			await speakCopilotMessage(
				{
					type: "route_update",
					priority,
					message,
					timestamp: Date.now(),
				},
				{ language: `${mergedConfig.language}-ES` },
			);
		},
		[isMuted, mergedConfig.language],
	);

	// Announce route summary at start
	const announceRouteSummary = useCallback(
		async (summary: {
			distanceKm: number;
			durationMinutes: number;
			weatherRisk: string;
		}) => {
			const riskMessages: Record<string, string> = {
				low: "Las condiciones climáticas son favorables",
				moderate: "Hay algunas condiciones moderadas en el camino",
				high: "Hay tramos con condiciones adversas, maneja con precaución",
				extreme: "Hay condiciones extremas en la ruta, considera alternativas",
			};

			const message =
				mergedConfig.language === "es"
					? `Iniciando navegación. ${summary.distanceKm.toFixed(1)} kilómetros, aproximadamente ${summary.durationMinutes} minutos. ${riskMessages[summary.weatherRisk] || riskMessages.moderate}.`
					: `Starting navigation. ${summary.distanceKm.toFixed(1)} kilometers, approximately ${summary.durationMinutes} minutes. ${riskMessages[summary.weatherRisk] || riskMessages.moderate}.`;

			await announce(message, "low");
		},
		[announce, mergedConfig.language],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stop();
		};
	}, [stop]);

	return {
		// State
		isActive,
		isMuted,
		lastMessage,
		isGeneratingAIMessage,
		weatherSegments,
		safePlaces,

		// Actions
		start,
		stop,
		toggleMute,
		announce,
		announceRouteSummary,

		// Data updates
		updateLocation,
		updateProgress,
		updateWeatherSegments,
		updateSafePlaces,

		// Manual check
		checkAndAnnounce,
	};
}
