export type AlertType =
  | "tornado"
  | "hail"
  | "thunderstorm"
  | "flood"
  | "hurricane"
  | "winter_storm"
  | "extreme_wind"
  | "extreme_heat"
  | "extreme_cold"
  | "other";

export type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";

export type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type NOAAAlert = {
  id: string;
  externalId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  instructions: string | null;
  source: "noaa";
  polygon: GeoJSONPolygon | null;
  startsAt: Date | null;
  expiresAt: Date | null;
};

type NOAAFeature = {
  id: string;
  properties: {
    id: string;
    event: string;
    severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
    headline: string;
    description: string;
    instruction: string | null;
    effective: string;
    expires: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  } | null;
};

type NOAAResponse = {
  features: NOAAFeature[];
};

const NOAA_BASE_URL = "https://api.weather.gov";

function mapEventToAlertType(event: string): AlertType {
  const eventLower = event.toLowerCase();

  if (eventLower.includes("tornado")) return "tornado";
  if (eventLower.includes("hail")) return "hail";
  if (
    eventLower.includes("thunderstorm") ||
    eventLower.includes("lightning") ||
    eventLower.includes("storm")
  )
    return "thunderstorm";
  if (eventLower.includes("flood") || eventLower.includes("flash"))
    return "flood";
  if (eventLower.includes("hurricane") || eventLower.includes("tropical"))
    return "hurricane";
  if (
    eventLower.includes("winter") ||
    eventLower.includes("blizzard") ||
    eventLower.includes("ice") ||
    eventLower.includes("snow")
  )
    return "winter_storm";
  if (eventLower.includes("wind") && !eventLower.includes("winter"))
    return "extreme_wind";
  if (eventLower.includes("heat") || eventLower.includes("excessive heat"))
    return "extreme_heat";
  if (
    eventLower.includes("cold") ||
    eventLower.includes("freeze") ||
    eventLower.includes("frost")
  )
    return "extreme_cold";

  return "other";
}

function mapSeverity(severity: NOAAFeature["properties"]["severity"]): AlertSeverity {
  switch (severity) {
    case "Extreme":
      return "extreme";
    case "Severe":
      return "severe";
    case "Moderate":
      return "moderate";
    case "Minor":
    default:
      return "minor";
  }
}

export async function getAlertsByPoint(
  latitude: number,
  longitude: number
): Promise<NOAAAlert[]> {
  const url = `${NOAA_BASE_URL}/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": "(advia.app, contact@advia.app)",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    if (response.status === 404) {
      // No alerts for this location
      return [];
    }
    throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as NOAAResponse;

  return data.features.map((feature) => ({
    id: crypto.randomUUID(),
    externalId: feature.properties.id,
    alertType: mapEventToAlertType(feature.properties.event),
    severity: mapSeverity(feature.properties.severity),
    title: feature.properties.headline,
    description: feature.properties.description || null,
    instructions: feature.properties.instruction || null,
    source: "noaa" as const,
    polygon: feature.geometry
      ? {
          type: "Polygon" as const,
          coordinates: feature.geometry.coordinates,
        }
      : null,
    startsAt: feature.properties.effective
      ? new Date(feature.properties.effective)
      : null,
    expiresAt: feature.properties.expires
      ? new Date(feature.properties.expires)
      : null,
  }));
}

export async function getAlertsByZone(zoneId: string): Promise<NOAAAlert[]> {
  const url = `${NOAA_BASE_URL}/alerts/active/zone/${zoneId}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": "(advia.app, contact@advia.app)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as NOAAResponse;

  return data.features.map((feature) => ({
    id: crypto.randomUUID(),
    externalId: feature.properties.id,
    alertType: mapEventToAlertType(feature.properties.event),
    severity: mapSeverity(feature.properties.severity),
    title: feature.properties.headline,
    description: feature.properties.description || null,
    instructions: feature.properties.instruction || null,
    source: "noaa" as const,
    polygon: feature.geometry
      ? {
          type: "Polygon" as const,
          coordinates: feature.geometry.coordinates,
        }
      : null,
    startsAt: feature.properties.effective
      ? new Date(feature.properties.effective)
      : null,
    expiresAt: feature.properties.expires
      ? new Date(feature.properties.expires)
      : null,
  }));
}

export async function getAllActiveAlerts(): Promise<NOAAAlert[]> {
  const url = `${NOAA_BASE_URL}/alerts/active`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": "(advia.app, contact@advia.app)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as NOAAResponse;

  return data.features.map((feature) => ({
    id: crypto.randomUUID(),
    externalId: feature.properties.id,
    alertType: mapEventToAlertType(feature.properties.event),
    severity: mapSeverity(feature.properties.severity),
    title: feature.properties.headline,
    description: feature.properties.description || null,
    instructions: feature.properties.instruction || null,
    source: "noaa" as const,
    polygon: feature.geometry
      ? {
          type: "Polygon" as const,
          coordinates: feature.geometry.coordinates,
        }
      : null,
    startsAt: feature.properties.effective
      ? new Date(feature.properties.effective)
      : null,
    expiresAt: feature.properties.expires
      ? new Date(feature.properties.expires)
      : null,
  }));
}
