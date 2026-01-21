# Tomorrow.io Weather Integration for Argentina

**Date:** 2025-01-20
**Status:** ✅ Implemented
**Scope:** National coverage for Argentina with weather-aware route planning

---

## Overview

Integrate Tomorrow.io as the primary weather data provider for Argentina, enabling:
- Real-time weather conditions along routes
- Severe weather alerts with tiered notifications
- Smart suggestions for nearby safe places during bad weather
- AI chat tools for weather-aware route assistance

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Native App)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Mapa con    │  │ Alertas UI  │  │ Sugerencias de      │  │
│  │ overlay de  │  │ escalonadas │  │ refugios cercanos   │  │
│  │ clima       │  │ por nivel   │  │ (Mapbox Places)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API (packages/api)                        │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ weather router  │  │ places router   │                   │
│  │ - Tomorrow.io   │  │ - Mapbox Search │                   │
│  │ - NOAA fallback │  │ - OSM fallback  │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tomorrow.io API                           │
│  - /timelines (realtime + forecast)                         │
│  - /routes (análisis de ruta completa)                      │
│  - /events (alertas severas)                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

- Tomorrow.io as primary provider for Argentina (NOAA doesn't cover LATAM)
- Keep NOAA for US users (already working)
- `source` field in `alert_history` already supports multiple providers
- New `weather` router separate from existing `alerts` for clarity
- Mapbox Search API for safe places (already integrated via token)

---

## Tomorrow.io API Integration

### Endpoints

| Endpoint | Use Case | Data Returned |
|----------|----------|---------------|
| `POST /v4/timelines` | Current weather + forecast by location | Temp, rain, wind, visibility, humidity |
| `POST /v4/route` | Full route analysis during planning | Conditions along the polyline |
| `GET /v4/events` | Active severe alerts | Storms, floods, hail |

### Weather Data Model

```typescript
interface WeatherData {
  // Real-time conditions
  temperature: number;              // °C
  humidity: number;                 // %
  windSpeed: number;                // km/h
  windGust: number;                 // km/h (gusts)
  visibility: number;               // km
  precipitationIntensity: number;   // mm/h
  precipitationType: 'none' | 'rain' | 'snow' | 'hail';

  // Risk indices (provided by Tomorrow.io)
  weatherCode: number;              // standardized code
  uvIndex: number;
  cloudCover: number;               // %

  // Derived for app logic
  roadRisk: 'low' | 'moderate' | 'high' | 'extreme';
}
```

### Severity Mapping (Tiered System)

| Condition | Severity | Action |
|-----------|----------|--------|
| Light rain, wind < 40km/h | `minor` | Icon on map |
| Moderate rain, wind 40-60km/h | `moderate` | Passive notification |
| Storm, hail, wind > 60km/h | `severe` | Popup "View nearby shelters?" |
| Tornado, active flooding | `extreme` | Suggested rerouting |

---

## Database Schema Changes

### New Tables

#### `weather_cache`
Cache weather data to minimize API calls.

```typescript
weather_cache {
  id: string (PK)
  latitude: numeric(10,7)
  longitude: numeric(10,7)
  data: jsonb                    // Full WeatherData
  source: 'tomorrow' | 'noaa'
  fetchedAt: timestamp
  expiresAt: timestamp           // fetchedAt + 5-15 min based on conditions

  index: (latitude, longitude, expiresAt)
}
```

#### `route_weather_analysis`
Store route analysis results for planning.

```typescript
route_weather_analysis {
  id: string (PK)
  savedRouteId: string (FK -> saved_route, optional)
  userId: string (FK -> user)
  polyline: text                 // encoded polyline from Mapbox
  segments: jsonb                // array of {km, lat, lng, weather}
  overallRisk: 'low' | 'moderate' | 'high' | 'extreme'
  alerts: jsonb                  // alerts intersecting the route
  analyzedAt: timestamp
  validUntil: timestamp          // ~1 hour for planning

  index: (userId, analyzedAt)
}
```

#### `safe_places_cache`
Cache POIs from Mapbox to reduce API calls.

```typescript
safe_places_cache {
  id: string (PK)
  latitude: numeric(10,7)
  longitude: numeric(10,7)
  radiusKm: numeric(5,2)
  places: jsonb                  // array of POIs from Mapbox
  fetchedAt: timestamp
  expiresAt: timestamp           // 24-48 hours (POIs change slowly)

  index: (latitude, longitude, radiusKm)
}
```

#### `api_usage`
Track API usage for monitoring and limits.

```typescript
api_usage {
  id: string (PK)
  date: date
  provider: 'tomorrow' | 'mapbox'
  endpoint: string
  callCount: integer
  createdAt: timestamp

  index: (date, provider)
}
```

### Modified Table: `trip_history`

Add fields for weather tracking during trips.

```typescript
trip_history {
  ...existing fields...
  + weatherSnapshots: jsonb      // array of {timestamp, lat, lng, weather}
  + maxRiskEncountered: 'low' | 'moderate' | 'high' | 'extreme'
  + alertsEncountered: jsonb     // alerts crossed during trip
}
```

---

## API Router Structure

### New Router: `weather.ts`

```typescript
weather.router = {
  // Current weather for a location
  getCurrent: protectedProcedure
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .query() // -> WeatherData (uses cache)

  // Hourly forecast (next 12h)
  getForecast: protectedProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
      hours: z.number().default(12)
    }))
    .query() // -> WeatherData[]

  // Active alerts in area (Tomorrow.io events)
  getAlerts: protectedProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().default(50)
    }))
    .query() // -> Alert[] (saves to alert_history)

  // Full route analysis (polyline)
  analyzeRoute: protectedProcedure
    .input(z.object({
      polyline: z.string(),
      savedRouteId: z.string().optional()
    }))
    .mutation() // -> RouteWeatherAnalysis

  // Monitoring during trip (discrete points, dynamic frequency)
  getRouteUpdates: protectedProcedure
    .input(z.object({
      currentLat: z.number(),
      currentLng: z.number(),
      destinationLat: z.number(),
      destinationLng: z.number(),
      hasActiveAlerts: z.boolean()
    }))
    .query() // -> { current: WeatherData, ahead: WeatherData[], alerts: Alert[] }
}
```

### New Router: `places.ts`

```typescript
places.router = {
  // Find nearby safe places
  getSafePlaces: protectedProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().default(20),
      types: z.array(z.enum(['gas_station', 'rest_area', 'town'])).optional()
    }))
    .query() // -> SafePlace[] (uses Mapbox Search + cache)
}
```

---

## UX Flow

### 1. Route Planning (Before Trip)

```
User selects destination
        │
        ▼
┌─────────────────────────────┐
│ Mapbox Directions API       │
│ (get polyline)              │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ weather.analyzeRoute()      │
│ (Tomorrow.io /route)        │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ Route view with weather overlay:            │
│ - Color-coded segments (green/yellow/red)   │
│ - Alert icons at affected points            │
│ - Overall risk badge                        │
│ - If high risk: suggest alternative time    │
└─────────────────────────────────────────────┘
```

### 2. During Trip (Active Monitoring)

```
useWeatherMonitor hook (new)
        │
        ├── Every 15 min (normal)
        │   └── weather.getRouteUpdates()
        │
        ├── Every 3 min (if nearby alerts)
        │   └── weather.getRouteUpdates({ hasActiveAlerts: true })
        │
        └── On severity change detection:
            │
            ├── minor/moderate → Update map icons
            │
            ├── severe → Modal "Storm in X km"
            │            └── Button "View nearby shelters"
            │                └── places.getSafePlaces()
            │
            └── extreme → Urgent modal
                         ├── "Alternative route available"
                         └── "Shelters X minutes away"
```

### 3. New UI Components

| Component | Purpose |
|-----------|---------|
| `WeatherOverlay` | Layer on map showing weather conditions |
| `RouteRiskBadge` | Risk indicator (low/moderate/high/extreme) |
| `WeatherAlertModal` | Tiered popup based on severity |
| `SafePlacesList` | List of nearby shelters with distance/time |

---

## AI Agent Tools (Gemini Chat)

### Tools to Add

```typescript
const weatherTools = {
  getCurrentWeather: tool({
    description: 'Gets current weather at a specific location',
    parameters: z.object({
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      locationName: z.string().optional().describe('Place name for context')
    }),
    execute: async ({ lat, lng }) => getWeatherData(lat, lng)
  }),

  getForecast: tool({
    description: 'Gets weather forecast for the next hours',
    parameters: z.object({
      lat: z.number(),
      lng: z.number(),
      hours: z.number().default(12).describe('Hours to forecast')
    }),
    execute: async ({ lat, lng, hours }) => getForecastData(lat, lng, hours)
  }),

  analyzeRouteWeather: tool({
    description: 'Analyzes weather conditions along a route',
    parameters: z.object({
      originLat: z.number(),
      originLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
      originName: z.string().optional(),
      destName: z.string().optional()
    }),
    execute: async (params) => analyzeRouteWeather(params)
  }),

  getActiveAlerts: tool({
    description: 'Finds active weather alerts near a location',
    parameters: z.object({
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().default(100)
    }),
    execute: async ({ lat, lng, radiusKm }) => getWeatherAlerts(lat, lng, radiusKm)
  }),

  findSafePlaces: tool({
    description: 'Finds gas stations, rest areas, or towns nearby for shelter',
    parameters: z.object({
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().default(20),
      placeTypes: z.array(z.enum(['gas_station', 'rest_area', 'town'])).optional()
    }),
    execute: async (params) => getSafePlaces(params)
  }),

  suggestBestDepartureTime: tool({
    description: 'Suggests best departure time based on route forecast',
    parameters: z.object({
      originLat: z.number(),
      originLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
      preferredDepartureTime: z.string().optional().describe('Preferred time HH:mm'),
      flexibilityHours: z.number().default(4).describe('Flexibility window in hours')
    }),
    execute: async (params) => findBestDepartureWindow(params)
  })
};
```

### Updated System Prompt

```typescript
const SYSTEM_PROMPT = `Sos un asistente de clima y rutas para conductores en Argentina y Latinoamérica.

Tenés acceso a herramientas para:
- Consultar clima actual y pronóstico
- Analizar condiciones de una ruta
- Buscar alertas meteorológicas activas
- Encontrar lugares seguros para refugiarse
- Sugerir mejores horarios para viajar

Usá estas herramientas para dar consejos precisos basados en datos reales.
Siempre priorizá la seguridad del conductor.
Respondé en español de forma clara y directa.`;
```

---

## Free Tier Optimization (500 calls/day)

### Daily Budget Allocation

| Endpoint | TTL | Estimated Calls |
|----------|-----|-----------------|
| getCurrent | 10 min | ~200 calls |
| getForecast | 30 min | ~100 calls |
| getAlerts | 5 min | ~150 calls |
| analyzeRoute | 1 hour | ~50 calls |

### Smart Caching Rules

```typescript
// 1. Cache by grid (not exact coordinates)
function getCacheKey(lat: number, lng: number): string {
  // Round to ~1km precision (avoids cache miss for meters)
  const gridLat = Math.round(lat * 100) / 100;  // 0.01° ≈ 1.1km
  const gridLng = Math.round(lng * 100) / 100;
  return `weather:${gridLat}:${gridLng}`;
}

// 2. Dynamic TTL based on conditions
function getCacheTTL(weather: WeatherData): number {
  if (weather.roadRisk === 'extreme') return 2 * 60;   // 2 min
  if (weather.roadRisk === 'high') return 5 * 60;      // 5 min
  if (weather.roadRisk === 'moderate') return 10 * 60; // 10 min
  return 15 * 60;                                       // 15 min normal
}

// 3. Background prefetch for saved routes
// Every hour, update weather for user's favorite routes
```

### Fallbacks When Limit Exhausted

1. Show last cached data with timestamp "Updated X min ago"
2. Use NOAA data if user is in coverage area
3. Degrade to alerts only (fewer calls)
4. Notify: "Weather data limited, will update tomorrow"

---

## Implementation Phases

### Phase 1: Base Infrastructure ✅
- [x] Configure Tomorrow.io API key in `packages/env`
- [x] Create new tables (`weather_cache`, `route_weather_analysis`, `safe_places_cache`, `api_usage`)
- [x] Modify `trip_history` with new fields
- [x] Tomorrow.io client with rate limit handling

### Phase 2: Weather Router ✅
- [x] `weather.getCurrent` with grid caching
- [x] `weather.getForecast` with dynamic TTL
- [x] `weather.getAlerts` integrated with `alert_history`
- [x] `weather.analyzeRoute` with Mapbox polyline
- [x] `weather.getRouteUpdates` for trip monitoring

### Phase 3: Places Router ✅
- [x] `places.getSafePlaces` with Mapbox Search API
- [x] 24-48 hour cache for POIs
- [x] Filters by type (gas stations, rest areas, towns)

### Phase 4: Native App UI ✅
- [x] `WeatherOverlay` for the map
- [x] `RouteRiskBadge` risk indicator
- [x] `useWeatherMonitor` hook with dynamic frequency
- [x] `WeatherAlertModal` tiered by severity
- [x] `SafePlacesList` with navigation to shelters

### Phase 5: Agent Tools ✅
- [x] Integrate 6 tools into Gemini chat
- [x] Update system prompt
- [x] Test conversations with tools

### Phase 6: Monitoring & Metrics ✅
- [x] API usage tracking (`api_usage` table)
- [x] `checkApiLimit()` function for daily limit alerts
- [x] `getUsageStats` endpoint for monitoring

---

## Environment Variables

Add to `packages/env/src/server.ts`:

```typescript
TOMORROW_IO_API_KEY: z.string(),
```

---

## Success Criteria

- [x] Weather data available for any location in Argentina
- [x] Route analysis shows risk levels before trip
- [x] Tiered alerts trigger appropriate UX responses
- [x] Safe places suggestions within 20km radius
- [x] AI chat can answer weather questions using tools
- [x] Free tier budget lasts full day with normal usage
- [x] Graceful degradation when API limit reached
