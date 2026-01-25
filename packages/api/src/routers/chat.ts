// packages/api/src/routers/chat.ts

import { google } from "@ai-sdk/google";
import { db } from "@driwet/db";
import { type PlaceType, safePlacesCache } from "@driwet/db/schema/index";
import { streamToEventIterator } from "@orpc/server";
import { streamText, tool } from "ai";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";
import { tomorrowClient } from "../lib/tomorrow-io";

const SYSTEM_PROMPT = `Sos Driwet, un asistente de clima y rutas para conductores en Argentina y Latinoamérica.

Tenés acceso a herramientas para:
- Consultar clima actual y pronóstico
- Analizar condiciones de una ruta
- Buscar alertas meteorológicas activas
- Encontrar lugares seguros para refugiarse
- Sugerir mejores horarios para viajar

Usá estas herramientas para dar consejos precisos basados en datos reales.
Siempre priorizá la seguridad del conductor.
Respondé en español de forma clara y directa.

Personalidad:
- Amigable y conciso
- Enfocado en la seguridad del usuario
- Usa español latinoamericano casual pero profesional
- Respuestas cortas y útiles (máximo 2-3 oraciones para cada punto)

Cuando uses una herramienta, interpreta los resultados de forma útil para el usuario.
Si el roadRisk es "high" o "extreme", enfatizá la precaución y sugerí refugios o rutas alternativas.`;

// Helper to fetch safe places (reuses cache)
async function getSafePlacesData(lat: number, lng: number, radiusKm: number) {
	const gridLat = Math.round(lat * 100) / 100;
	const gridLng = Math.round(lng * 100) / 100;
	const cacheId = `places:${gridLat}:${gridLng}:${radiusKm}`;

	const cached = await db
		.select()
		.from(safePlacesCache)
		.where(
			and(
				eq(safePlacesCache.id, cacheId),
				gt(safePlacesCache.expiresAt, new Date()),
			),
		)
		.limit(1);

	if (cached.length > 0 && cached[0]?.places) {
		return cached[0].places;
	}

	// Return empty if not cached (the places router will fetch from Mapbox)
	return [];
}

// Define weather tools for the AI
const weatherTools = {
	getCurrentWeather: tool({
		description:
			"Obtiene el clima actual en una ubicación específica. Devuelve temperatura, viento, visibilidad, precipitación y nivel de riesgo vial.",
		inputSchema: z.object({
			lat: z.number().describe("Latitud de la ubicación"),
			lng: z.number().describe("Longitud de la ubicación"),
			locationName: z
				.string()
				.optional()
				.describe("Nombre del lugar para contexto"),
		}),
		execute: async ({ lat, lng, locationName }) => {
			try {
				const { current } = await tomorrowClient.getTimelines(lat, lng, {
					hours: 1,
				});
				return {
					location: locationName || `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
					temperature: `${Math.round(current.temperature)}°C`,
					humidity: `${current.humidity}%`,
					windSpeed: `${Math.round(current.windSpeed)} km/h`,
					windGust: `${Math.round(current.windGust)} km/h`,
					visibility: `${current.visibility.toFixed(1)} km`,
					precipitation:
						current.precipitationType !== "none"
							? `${current.precipitationType}: ${current.precipitationIntensity.toFixed(1)} mm/h`
							: "Sin precipitación",
					roadRisk: current.roadRisk,
					recommendation:
						current.roadRisk === "extreme"
							? "NO VIAJAR - Condiciones peligrosas"
							: current.roadRisk === "high"
								? "Precaución extrema - Considerar postponer viaje"
								: current.roadRisk === "moderate"
									? "Conducir con cuidado"
									: "Condiciones favorables",
				};
			} catch {
				return { error: "No se pudo obtener el clima. Intentá de nuevo." };
			}
		},
	}),

	getForecast: tool({
		description:
			"Obtiene el pronóstico del clima para las próximas horas en una ubicación.",
		inputSchema: z.object({
			lat: z.number().describe("Latitud"),
			lng: z.number().describe("Longitud"),
			hours: z
				.number()
				.min(1)
				.max(24)
				.default(12)
				.describe("Cantidad de horas a pronosticar"),
		}),
		execute: async ({ lat, lng, hours }) => {
			try {
				const { hourly } = await tomorrowClient.getTimelines(lat, lng, {
					hours,
				});

				// Summarize the forecast
				const summary = hourly.slice(0, hours).map((h) => ({
					time: new Date(h.time).toLocaleTimeString("es-AR", {
						hour: "2-digit",
						minute: "2-digit",
					}),
					temp: `${Math.round(h.weather.temperature)}°C`,
					risk: h.weather.roadRisk,
					precipitation: h.weather.precipitationType,
				}));

				const worstRisk = summary.reduce((worst, h) => {
					const priority = { low: 0, moderate: 1, high: 2, extreme: 3 };
					return priority[h.risk as keyof typeof priority] >
						priority[worst as keyof typeof priority]
						? h.risk
						: worst;
				}, "low");

				return {
					forecast: summary,
					hoursAnalyzed: hours,
					worstExpectedRisk: worstRisk,
					recommendation:
						worstRisk === "extreme" || worstRisk === "high"
							? `Se esperan condiciones ${worstRisk === "extreme" ? "extremas" : "adversas"} en las próximas ${hours} horas. Recomiendo revisar el pronóstico antes de salir.`
							: "Condiciones generalmente favorables para las próximas horas.",
				};
			} catch {
				return { error: "No se pudo obtener el pronóstico." };
			}
		},
	}),

	analyzeRouteWeather: tool({
		description:
			"Analiza las condiciones climáticas a lo largo de una ruta entre dos puntos.",
		inputSchema: z.object({
			originLat: z.number().describe("Latitud de origen"),
			originLng: z.number().describe("Longitud de origen"),
			destLat: z.number().describe("Latitud de destino"),
			destLng: z.number().describe("Longitud de destino"),
			originName: z.string().optional().describe("Nombre del origen"),
			destName: z.string().optional().describe("Nombre del destino"),
		}),
		execute: async ({
			originLat,
			originLng,
			destLat,
			destLng,
			originName,
			destName,
		}) => {
			try {
				// Sample points along the route
				const points = [];
				const numPoints = 5;
				for (let i = 0; i <= numPoints; i++) {
					const ratio = i / numPoints;
					points.push({
						lat: originLat + (destLat - originLat) * ratio,
						lng: originLng + (destLng - originLng) * ratio,
						km: Math.round(ratio * 100), // Approximate
					});
				}

				const { segments, overallRisk } =
					await tomorrowClient.analyzeRoute(points);

				const riskySegments = segments.filter(
					(s) =>
						s.weather.roadRisk === "high" || s.weather.roadRisk === "extreme",
				);

				return {
					route: `${originName || "Origen"} → ${destName || "Destino"}`,
					overallRisk,
					segmentsAnalyzed: segments.length,
					riskyAreas: riskySegments.length,
					details: segments.map((s) => ({
						km: s.km,
						risk: s.weather.roadRisk,
						conditions:
							s.weather.precipitationType !== "none"
								? `${s.weather.precipitationType}, viento ${Math.round(s.weather.windSpeed)} km/h`
								: `Despejado, viento ${Math.round(s.weather.windSpeed)} km/h`,
					})),
					recommendation:
						overallRisk === "extreme"
							? "RUTA NO RECOMENDADA - Hay condiciones extremas. Buscar alternativa o postponer."
							: overallRisk === "high"
								? "Precaución - Hay tramos con condiciones adversas. Considerar refugios en el camino."
								: overallRisk === "moderate"
									? "Ruta transitable con precaución. Estar atento a cambios."
									: "Ruta en buenas condiciones.",
				};
			} catch {
				return { error: "No se pudo analizar la ruta." };
			}
		},
	}),

	getActiveAlerts: tool({
		description: "Busca alertas meteorológicas activas cerca de una ubicación.",
		inputSchema: z.object({
			lat: z.number().describe("Latitud"),
			lng: z.number().describe("Longitud"),
			radiusKm: z
				.number()
				.min(10)
				.max(200)
				.default(100)
				.describe("Radio de búsqueda en km"),
		}),
		execute: async ({ lat, lng, radiusKm }) => {
			try {
				const events = await tomorrowClient.getEvents(lat, lng, radiusKm);

				if (events.length === 0) {
					return {
						alertCount: 0,
						message: "No hay alertas meteorológicas activas en tu zona.",
					};
				}

				return {
					alertCount: events.length,
					alerts: events.map((e) => ({
						type: e.type,
						severity: e.severity,
						title: e.title,
						description: e.description,
					})),
					recommendation: events.some(
						(e) => e.severity === "extreme" || e.severity === "severe",
					)
						? "HAY ALERTAS SEVERAS - Tomar precauciones inmediatas."
						: "Hay alertas activas. Mantenete informado antes de viajar.",
				};
			} catch {
				return { error: "No se pudieron obtener las alertas." };
			}
		},
	}),

	findSafePlaces: tool({
		description:
			"Encuentra estaciones de servicio, paradores o pueblos cercanos para refugiarse del mal clima.",
		inputSchema: z.object({
			lat: z.number().describe("Latitud"),
			lng: z.number().describe("Longitud"),
			radiusKm: z
				.number()
				.min(5)
				.max(50)
				.default(20)
				.describe("Radio de búsqueda en km"),
			placeTypes: z
				.array(z.enum(["gas_station", "rest_area", "town"]))
				.optional()
				.describe("Tipos de lugares a buscar"),
		}),
		execute: async ({ lat, lng, radiusKm, placeTypes }) => {
			try {
				const places = await getSafePlacesData(lat, lng, radiusKm);

				const filtered = placeTypes
					? places.filter((p) => placeTypes.includes(p.type as PlaceType))
					: places;

				if (filtered.length === 0) {
					return {
						count: 0,
						message:
							"No encontré lugares cercanos en el caché. Usá la app para buscar refugios.",
					};
				}

				const typeLabels: Record<string, string> = {
					gas_station: "Estación de servicio",
					rest_area: "Parador",
					town: "Localidad",
				};

				return {
					count: filtered.length,
					places: filtered.slice(0, 5).map((p) => ({
						name: p.name,
						type: typeLabels[p.type] || p.type,
						distance: p.distanceKm
							? `${p.distanceKm} km`
							: "Distancia desconocida",
					})),
					recommendation:
						"Estos son los lugares más cercanos donde podés refugiarte si las condiciones empeoran.",
				};
			} catch {
				return { error: "No se pudieron buscar lugares." };
			}
		},
	}),

	suggestBestDepartureTime: tool({
		description:
			"Sugiere el mejor horario para salir basado en el pronóstico de la ruta.",
		inputSchema: z.object({
			originLat: z.number().describe("Latitud de origen"),
			originLng: z.number().describe("Longitud de origen"),
			destLat: z.number().describe("Latitud de destino"),
			destLng: z.number().describe("Longitud de destino"),
			preferredDepartureTime: z
				.string()
				.optional()
				.describe("Hora preferida en formato HH:mm"),
			flexibilityHours: z
				.number()
				.min(1)
				.max(12)
				.default(4)
				.describe("Ventana de flexibilidad en horas"),
		}),
		execute: async ({ originLat, originLng, flexibilityHours }) => {
			try {
				// Get forecast for origin
				const { hourly } = await tomorrowClient.getTimelines(
					originLat,
					originLng,
					{ hours: flexibilityHours + 6 },
				);

				// Find best window (lowest risk)
				const riskPriority = { low: 0, moderate: 1, high: 2, extreme: 3 };

				let bestWindow = hourly[0];
				let bestRisk = bestWindow?.weather.roadRisk || "moderate";

				for (const h of hourly.slice(0, flexibilityHours)) {
					if (
						riskPriority[h.weather.roadRisk as keyof typeof riskPriority] <
						riskPriority[bestRisk as keyof typeof riskPriority]
					) {
						bestWindow = h;
						bestRisk = h.weather.roadRisk;
					}
				}

				const bestTime = bestWindow
					? new Date(bestWindow.time).toLocaleTimeString("es-AR", {
							hour: "2-digit",
							minute: "2-digit",
						})
					: "ahora";

				return {
					suggestedDepartureTime: bestTime,
					expectedRisk: bestRisk,
					flexibility: `Analicé las próximas ${flexibilityHours} horas`,
					recommendation:
						bestRisk === "low"
							? `El mejor momento para salir es ${bestTime}. Condiciones favorables.`
							: bestRisk === "moderate"
								? `Podés salir a las ${bestTime}, pero manejá con precaución.`
								: `Las condiciones no son ideales en las próximas ${flexibilityHours} horas. Considerá postponer si es posible.`,
				};
			} catch {
				return { error: "No se pudo calcular el mejor horario." };
			}
		},
	}),
};

export const chatRouter = {
	sendMessage: publicProcedure
		.input(
			z.object({
				message: z.string().min(1),
				history: z
					.array(
						z.object({
							role: z.enum(["user", "assistant"]),
							content: z.string(),
						}),
					)
					.optional(),
				location: z
					.object({
						latitude: z.number(),
						longitude: z.number(),
					})
					.optional(),
			}),
		)
		.handler(async ({ input }) => {
			const messages = [
				...(input.history?.map((msg) => ({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				})) || []),
				{ role: "user" as const, content: input.message },
			];

			// Add location context if available
			let systemPrompt = SYSTEM_PROMPT;
			if (input.location) {
				systemPrompt += `\n\nUbicación actual del usuario: ${input.location.latitude.toFixed(4)}, ${input.location.longitude.toFixed(4)}. Usá esta ubicación por defecto cuando el usuario pregunte sobre el clima "aquí" o "mi zona".`;
			}

			try {
				const result = streamText({
					model: google("gemini-2.0-flash"),
					system: systemPrompt,
					messages,
					tools: weatherTools,
				});

				// Use oRPC's streamToEventIterator for proper SSE streaming
				return streamToEventIterator(result.textStream);
			} catch (error) {
				// Handle rate limit errors gracefully
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				const isRateLimited =
					errorMessage.includes("Resource exhausted") ||
					errorMessage.includes("429") ||
					errorMessage.includes("quota");

				const fallbackMessage = isRateLimited
					? "El servicio de IA está temporalmente sobrecargado. Por favor, intenta de nuevo en unos minutos. Mientras tanto, podés ver el clima directamente en el mapa."
					: "Hubo un error procesando tu mensaje. Por favor, intenta de nuevo.";

				// Return fallback as a ReadableStream
				const fallbackStream = new ReadableStream({
					start(controller) {
						controller.enqueue(fallbackMessage);
						controller.close();
					},
				});
				return streamToEventIterator(fallbackStream);
			}
		}),
};
