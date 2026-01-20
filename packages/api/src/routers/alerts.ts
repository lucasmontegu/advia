import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '../index';

const NOAA_API_BASE = 'https://api.weather.gov';

export const alertsRouter = {
  getActive: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .handler(async ({ input }) => {
      try {
        const response = await fetch(
          `${NOAA_API_BASE}/alerts/active?point=${input.latitude},${input.longitude}`,
          {
            headers: {
              'User-Agent': 'Advia Weather App',
              Accept: 'application/geo+json',
            },
          }
        );

        if (!response.ok) {
          return { alerts: [] };
        }

        const data = await response.json() as { features?: any[] };

        const alerts = data.features?.map((feature: any) => ({
          id: feature.id,
          type: feature.properties.event,
          severity: mapSeverity(feature.properties.severity),
          headline: feature.properties.headline,
          description: feature.properties.description,
          expires: feature.properties.expires,
          polygon: feature.geometry,
        })) || [];

        return { alerts };
      } catch (error) {
        console.error('Error fetching alerts:', error);
        return { alerts: [] };
      }
    }),

  getHistory: protectedProcedure.handler(async () => {
    // TODO: Implement from alert_history table
    return { alerts: [] };
  }),
};

function mapSeverity(noaaSeverity: string): 'extreme' | 'severe' | 'moderate' | 'minor' {
  switch (noaaSeverity?.toLowerCase()) {
    case 'extreme':
      return 'extreme';
    case 'severe':
      return 'severe';
    case 'moderate':
      return 'moderate';
    default:
      return 'minor';
  }
}
