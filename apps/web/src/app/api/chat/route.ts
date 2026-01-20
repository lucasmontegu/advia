import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { z } from "zod";
import { getAlertsByPoint } from "@/lib/weather";

export const maxDuration = 30;

// Tool parameter schemas
const getWeatherAlertsSchema = z.object({
  latitude: z.number().describe("Latitud de la ubicación"),
  longitude: z.number().describe("Longitud de la ubicación"),
  locationName: z
    .string()
    .optional()
    .describe("Nombre de la ubicación para referencia"),
});

const showAlertOnMapSchema = z.object({
  alertId: z.string().describe("ID de la alerta a mostrar"),
  alertType: z.string().describe("Tipo de alerta"),
  severity: z.string().describe("Severidad de la alerta"),
  centerLat: z.number().describe("Latitud del centro de la alerta"),
  centerLon: z.number().describe("Longitud del centro de la alerta"),
  zoomLevel: z.number().optional().default(10).describe("Nivel de zoom del mapa"),
});

const analyzeRouteSchema = z.object({
  startLat: z.number().describe("Latitud del punto de inicio"),
  startLon: z.number().describe("Longitud del punto de inicio"),
  endLat: z.number().describe("Latitud del destino"),
  endLon: z.number().describe("Longitud del destino"),
  startName: z.string().optional().describe("Nombre del origen"),
  endName: z.string().optional().describe("Nombre del destino"),
});

const getUserLocationSchema = z.object({
  reason: z.string().describe("Razón por la cual necesitas la ubicación"),
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: `Eres Advia, un asistente de alertas meteorológicas. Tu objetivo es mantener a los usuarios seguros informándoles sobre condiciones climáticas peligrosas.

Capacidades:
- Puedes obtener alertas meteorológicas para cualquier ubicación usando la herramienta getWeatherAlerts
- Puedes mostrar alertas en el mapa usando la herramienta showAlertOnMap
- Puedes analizar rutas para seguridad usando la herramienta analyzeRoute

Comportamiento:
- Responde siempre en español a menos que el usuario escriba en otro idioma
- Sé conciso pero informativo sobre las alertas
- Prioriza la seguridad del usuario
- Si hay alertas severas o extremas, enfatiza la urgencia
- Sugiere acciones concretas cuando sea apropiado

Formato:
- Usa emojis relacionados al clima para hacer los mensajes más visuales
- Para alertas extremas usa ⚠️ o 🚨
- Para información general usa 🌤️ o ℹ️`,
    messages,
    tools: {
      getWeatherAlerts: {
        description:
          "Obtiene las alertas meteorológicas activas para una ubicación específica. Usa esta herramienta cuando el usuario pregunte sobre el clima o alertas en un lugar.",
        inputSchema: getWeatherAlertsSchema,
        execute: async (args: z.infer<typeof getWeatherAlertsSchema>) => {
          const { latitude, longitude, locationName } = args;
          try {
            const alerts = await getAlertsByPoint(latitude, longitude);

            if (alerts.length === 0) {
              return {
                success: true,
                location: locationName || `${latitude}, ${longitude}`,
                alertCount: 0,
                alerts: [],
                message: "No hay alertas activas para esta ubicación",
              };
            }

            return {
              success: true,
              location: locationName || `${latitude}, ${longitude}`,
              alertCount: alerts.length,
              alerts: alerts.map((alert) => ({
                id: alert.id,
                type: alert.alertType,
                severity: alert.severity,
                title: alert.title,
                description: alert.description,
                instructions: alert.instructions,
                expiresAt: alert.expiresAt?.toISOString(),
                hasPolygon: !!alert.polygon,
              })),
            };
          } catch {
            return {
              success: false,
              error: "No se pudieron obtener las alertas. Intenta de nuevo.",
            };
          }
        },
      },

      showAlertOnMap: {
        description:
          "Muestra una alerta específica en el mapa del usuario. Usa esta herramienta después de obtener alertas para visualizarlas.",
        inputSchema: showAlertOnMapSchema,
        execute: async (args: z.infer<typeof showAlertOnMapSchema>) => {
          const { alertId, alertType, severity, centerLat, centerLon, zoomLevel } = args;
          return {
            action: "showAlert",
            alertId,
            alertType,
            severity,
            center: { latitude: centerLat, longitude: centerLon },
            zoom: zoomLevel,
          };
        },
      },

      analyzeRoute: {
        description:
          "Analiza una ruta para determinar si es segura considerando las alertas meteorológicas actuales. Usa esta herramienta cuando el usuario pregunte sobre viajar a algún lugar.",
        inputSchema: analyzeRouteSchema,
        execute: async (args: z.infer<typeof analyzeRouteSchema>) => {
          const { startLat, startLon, endLat, endLon, startName, endName } = args;
          const midLat = (startLat + endLat) / 2;
          const midLon = (startLon + endLon) / 2;

          const [startAlerts, midAlerts, endAlerts] = await Promise.all([
            getAlertsByPoint(startLat, startLon),
            getAlertsByPoint(midLat, midLon),
            getAlertsByPoint(endLat, endLon),
          ]);

          const allAlerts = [...startAlerts, ...midAlerts, ...endAlerts];
          const uniqueAlerts = allAlerts.filter(
            (alert, index, self) =>
              index === self.findIndex((a) => a.externalId === alert.externalId)
          );

          const severeAlerts = uniqueAlerts.filter(
            (a) => a.severity === "extreme" || a.severity === "severe"
          );

          const isSafe = severeAlerts.length === 0;

          return {
            route: {
              start: startName || `${startLat}, ${startLon}`,
              end: endName || `${endLat}, ${endLon}`,
            },
            isSafe,
            riskLevel:
              severeAlerts.length > 0
                ? "high"
                : uniqueAlerts.length > 0
                  ? "moderate"
                  : "low",
            totalAlerts: uniqueAlerts.length,
            severeAlerts: severeAlerts.length,
            alerts: uniqueAlerts.map((a) => ({
              type: a.alertType,
              severity: a.severity,
              title: a.title,
            })),
            recommendation: isSafe
              ? "La ruta parece segura. Mantente atento a las condiciones."
              : "Se recomienda posponer el viaje o buscar una ruta alternativa.",
          };
        },
      },

      getUserLocation: {
        description:
          "Solicita la ubicación actual del usuario. Usa esto cuando necesites saber dónde está el usuario.",
        inputSchema: getUserLocationSchema,
        execute: async (args: z.infer<typeof getUserLocationSchema>) => {
          return {
            action: "requestLocation",
            reason: args.reason,
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
