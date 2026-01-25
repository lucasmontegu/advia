// apps/mobile/services/navigation-copilot.ts
import * as Speech from "expo-speech";
import type { RouteProgress } from "@/components/navigation/navigation-view";
import type { NavigationLocation } from "@/hooks/use-navigation";

export type WeatherCondition = {
	type: "rain" | "hail" | "storm" | "wind" | "fog" | "clear";
	severity: "low" | "moderate" | "high" | "extreme";
	precipitationIntensity?: number;
	windSpeed?: number;
	visibility?: number;
};

export type RouteWeatherSegment = {
	startKm: number;
	endKm: number;
	condition: WeatherCondition;
	roadRisk: "low" | "moderate" | "high" | "extreme";
};

export type SafePlace = {
	id: string;
	name: string;
	type: "gas_station" | "rest_area" | "town";
	distance: number;
	coordinates: { latitude: number; longitude: number };
};

export type CopilotContext = {
	location: NavigationLocation | null;
	progress: RouteProgress | null;
	weatherSegments: RouteWeatherSegment[];
	safePlaces: SafePlace[];
	language: string;
};

type CopilotMessage = {
	type:
		| "weather_warning"
		| "shelter_suggestion"
		| "speed_advisory"
		| "route_update"
		| "arrival";
	priority: "low" | "medium" | "high" | "critical";
	message: string;
	timestamp: number;
};

// Cooldown tracking to avoid repetitive announcements
const announcementCooldowns = new Map<string, number>();
const COOLDOWN_MS = 60000; // 1 minute cooldown for same message type

// Track last known conditions for change detection
let lastAnnouncedRisk: string | null = null;
let lastWeatherWarningKm: number | null = null;

/**
 * Generate contextual navigation copilot messages based on current conditions
 */
export function generateCopilotMessage(
	context: CopilotContext,
): CopilotMessage | null {
	const { location, progress, weatherSegments, safePlaces } = context;

	if (!location || !progress) {
		return null;
	}

	const currentKm = progress.distanceTraveled / 1000;
	const remainingKm = progress.distanceRemaining / 1000;

	// Check for approaching severe weather
	const approachingWeather = weatherSegments.find(
		(seg) =>
			seg.startKm > currentKm &&
			seg.startKm <= currentKm + 10 && // Within 10km ahead
			(seg.roadRisk === "high" || seg.roadRisk === "extreme"),
	);

	if (approachingWeather && !isOnCooldown("weather_ahead")) {
		const distanceToWeather = approachingWeather.startKm - currentKm;
		const message = generateWeatherWarningMessage(
			approachingWeather,
			distanceToWeather,
			safePlaces,
			context.language,
		);

		if (
			message &&
			lastWeatherWarningKm !== Math.round(approachingWeather.startKm)
		) {
			lastWeatherWarningKm = Math.round(approachingWeather.startKm);
			setCooldown("weather_ahead");

			return {
				type: "weather_warning",
				priority:
					approachingWeather.roadRisk === "extreme" ? "critical" : "high",
				message,
				timestamp: Date.now(),
			};
		}
	}

	// Check for current weather change
	const currentWeather = weatherSegments.find(
		(seg) => currentKm >= seg.startKm && currentKm < seg.endKm,
	);

	if (
		currentWeather &&
		currentWeather.roadRisk !== lastAnnouncedRisk &&
		!isOnCooldown("weather_change")
	) {
		lastAnnouncedRisk = currentWeather.roadRisk;

		if (
			currentWeather.roadRisk === "high" ||
			currentWeather.roadRisk === "extreme"
		) {
			setCooldown("weather_change");

			return {
				type: "weather_warning",
				priority: currentWeather.roadRisk === "extreme" ? "critical" : "high",
				message: generateCurrentWeatherMessage(
					currentWeather,
					context.language,
				),
				timestamp: Date.now(),
			};
		}
	}

	// Speed advisory for current conditions
	if (currentWeather && location.speed > 0) {
		const recommendedSpeed = getRecommendedSpeed(currentWeather.roadRisk);
		const currentSpeedKmh = location.speed * 3.6; // Convert m/s to km/h

		if (
			currentSpeedKmh > recommendedSpeed + 20 &&
			!isOnCooldown("speed_advisory")
		) {
			setCooldown("speed_advisory");

			return {
				type: "speed_advisory",
				priority: "medium",
				message: getSpeedAdvisoryMessage(
					currentWeather.roadRisk,
					recommendedSpeed,
					context.language,
				),
				timestamp: Date.now(),
			};
		}
	}

	// Suggest shelter when conditions are severe and shelter is nearby
	if (
		currentWeather?.roadRisk === "extreme" &&
		safePlaces.length > 0 &&
		!isOnCooldown("shelter_suggestion")
	) {
		const nearestShelter = safePlaces.sort(
			(a, b) => a.distance - b.distance,
		)[0];

		if (nearestShelter && nearestShelter.distance < 5) {
			setCooldown("shelter_suggestion");

			return {
				type: "shelter_suggestion",
				priority: "critical",
				message: getShelterSuggestionMessage(nearestShelter, context.language),
				timestamp: Date.now(),
			};
		}
	}

	// Near arrival announcement
	if (remainingKm <= 1 && !isOnCooldown("near_arrival")) {
		setCooldown("near_arrival");

		return {
			type: "arrival",
			priority: "low",
			message:
				context.language === "es"
					? `Estás a ${Math.round(remainingKm * 1000)} metros de tu destino.`
					: `You are ${Math.round(remainingKm * 1000)} meters from your destination.`,
			timestamp: Date.now(),
		};
	}

	return null;
}

/**
 * Speak a copilot message
 */
export async function speakCopilotMessage(
	message: CopilotMessage,
	options?: { language?: string; force?: boolean },
): Promise<void> {
	const { language = "es-ES", force = false } = options || {};

	// Critical messages interrupt current speech
	if (message.priority === "critical" || force) {
		await Speech.stop();
	}

	return new Promise((resolve, reject) => {
		Speech.speak(message.message, {
			language,
			rate: message.priority === "critical" ? 1.0 : 0.9,
			pitch: message.priority === "critical" ? 1.1 : 1.0,
			onDone: () => resolve(),
			onError: (error) => reject(error),
			onStopped: () => resolve(),
		});
	});
}

/**
 * Get all pending announcements for current context
 */
export function getPendingAnnouncements(
	context: CopilotContext,
): CopilotMessage[] {
	const messages: CopilotMessage[] = [];
	const message = generateCopilotMessage(context);

	if (message) {
		messages.push(message);
	}

	// Sort by priority (critical first)
	const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
	return messages.sort(
		(a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
	);
}

/**
 * Reset copilot state (call when starting new navigation)
 */
export function resetCopilotState(): void {
	announcementCooldowns.clear();
	lastAnnouncedRisk = null;
	lastWeatherWarningKm = null;
}

// Helper functions

function isOnCooldown(type: string): boolean {
	const lastTime = announcementCooldowns.get(type);
	if (!lastTime) return false;
	return Date.now() - lastTime < COOLDOWN_MS;
}

function setCooldown(type: string): void {
	announcementCooldowns.set(type, Date.now());
}

function generateWeatherWarningMessage(
	segment: RouteWeatherSegment,
	distanceKm: number,
	safePlaces: SafePlace[],
	language: string,
): string {
	const distanceText =
		distanceKm < 1
			? `${Math.round(distanceKm * 1000)} metros`
			: `${distanceKm.toFixed(1)} kilómetros`;

	const conditionText = getConditionText(segment.condition, language);
	const riskText = getRiskText(segment.roadRisk, language);

	let message =
		language === "es"
			? `Atención. En ${distanceText} hay ${conditionText}. ${riskText}.`
			: `Warning. In ${distanceText} there is ${conditionText}. ${riskText}.`;

	// Add shelter suggestion if available and conditions are severe
	if (segment.roadRisk === "extreme" && safePlaces.length > 0) {
		const nearest = safePlaces.sort((a, b) => a.distance - b.distance)[0];
		if (nearest && nearest.distance < distanceKm) {
			message +=
				language === "es"
					? ` Hay un refugio en ${nearest.name} a ${nearest.distance.toFixed(1)} kilómetros.`
					: ` There's a shelter at ${nearest.name}, ${nearest.distance.toFixed(1)} kilometers away.`;
		}
	}

	return message;
}

function generateCurrentWeatherMessage(
	segment: RouteWeatherSegment,
	language: string,
): string {
	const conditionText = getConditionText(segment.condition, language);
	const riskText = getRiskText(segment.roadRisk, language);

	return language === "es"
		? `Entrando en zona con ${conditionText}. ${riskText}. Reduce la velocidad.`
		: `Entering area with ${conditionText}. ${riskText}. Reduce speed.`;
}

function getConditionText(
	condition: WeatherCondition,
	language: string,
): string {
	const conditions: Record<string, { es: string; en: string }> = {
		rain: { es: "lluvia", en: "rain" },
		hail: { es: "granizo", en: "hail" },
		storm: { es: "tormenta eléctrica", en: "thunderstorm" },
		wind: { es: "vientos fuertes", en: "strong winds" },
		fog: { es: "niebla", en: "fog" },
		clear: { es: "clima despejado", en: "clear weather" },
	};

	const base = conditions[condition.type] || conditions.clear;
	let text = language === "es" ? base.es : base.en;

	if (condition.severity === "extreme" || condition.severity === "high") {
		text = language === "es" ? `${text} intensa` : `heavy ${text}`;
	}

	return text;
}

function getRiskText(risk: string, language: string): string {
	const risks: Record<string, { es: string; en: string }> = {
		low: { es: "Condiciones favorables", en: "Favorable conditions" },
		moderate: { es: "Conducir con precaución", en: "Drive with caution" },
		high: {
			es: "Condiciones adversas, precaución extrema",
			en: "Adverse conditions, extreme caution",
		},
		extreme: {
			es: "Condiciones peligrosas, considere detenerse",
			en: "Dangerous conditions, consider stopping",
		},
	};

	return language === "es"
		? risks[risk]?.es || risks.moderate.es
		: risks[risk]?.en || risks.moderate.en;
}

function getRecommendedSpeed(risk: string): number {
	const speeds: Record<string, number> = {
		low: 120,
		moderate: 90,
		high: 60,
		extreme: 40,
	};
	return speeds[risk] || 90;
}

function getSpeedAdvisoryMessage(
	risk: string,
	recommendedSpeed: number,
	language: string,
): string {
	return language === "es"
		? `Debido a las condiciones climáticas, se recomienda no superar los ${recommendedSpeed} kilómetros por hora.`
		: `Due to weather conditions, it's recommended not to exceed ${recommendedSpeed} kilometers per hour.`;
}

function getShelterSuggestionMessage(
	shelter: SafePlace,
	language: string,
): string {
	const typeLabels: Record<string, { es: string; en: string }> = {
		gas_station: { es: "estación de servicio", en: "gas station" },
		rest_area: { es: "parador", en: "rest area" },
		town: { es: "localidad", en: "town" },
	};

	const typeText =
		language === "es"
			? typeLabels[shelter.type]?.es || "refugio"
			: typeLabels[shelter.type]?.en || "shelter";

	return language === "es"
		? `Las condiciones son peligrosas. Hay una ${typeText} llamada ${shelter.name} a ${shelter.distance.toFixed(1)} kilómetros. Considere detenerse.`
		: `Conditions are dangerous. There's a ${typeText} called ${shelter.name} ${shelter.distance.toFixed(1)} kilometers away. Consider stopping.`;
}
