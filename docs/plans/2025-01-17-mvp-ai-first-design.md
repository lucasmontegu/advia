# Advia MVP: AI-First Storm Advisor

**Fecha:** 2025-01-17
**Autor:** Lucas
**Estado:** Aprobado
**Duración estimada:** 4 semanas

---

## Visión

Una app móvil AI-first donde el usuario interactúa con un agente inteligente a través de chat/voz. El agente alerta sobre clima peligroso, responde preguntas sobre rutas, y muestra información visualmente en el mapa.

---

## Arquitectura de UI

```
┌─────────────────────────────────────────┐
│                                         │
│              MAPBOX MAP                 │
│         (fullscreen, 70% altura)        │
│                                         │
│         📍 Usuario                      │
│         ⚠️ Zonas de alerta (polígonos)  │
│                                         │
├─────────────────────────────────────────┤
│  💬 Chat fijo (30% altura)              │
│  ┌─────────────────────────────────────┐│
│  │ Mensajes del agente + usuario       ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ 🎤  Escribe o habla...        [→]  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Flujo de interacción
1. Usuario abre la app → ve mapa centrado en su ubicación
2. El agente automáticamente chequea alertas y las muestra
3. Usuario puede preguntar: "¿Es seguro ir a Córdoba?" o "¿Dónde me refugio?"
4. El agente responde y actualiza el mapa (markers, rutas, zonas)

---

## AI Agent Tools

```typescript
// Tools disponibles para el agente:

getWeatherAlerts
→ Obtiene alertas de NOAA/SMN para una ubicación
→ Input: { lat, lng, radius }
→ Output: { alerts[], severity, instructions }

getUserLocation
→ Obtiene la ubicación actual del usuario
→ Output: { lat, lng, city, country }

showAlertOnMap
→ Dibuja un polígono de alerta en el mapa
→ Input: { polygon, severity, title }
→ El mapa se actualiza visualmente

analyzeRoute
→ Analiza si una ruta tiene clima peligroso
→ Input: { origin, destination }
→ Output: { safe: boolean, warnings[], recommendation }
```

---

## Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                      ADVIA MVP ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  apps/native (Expo)                                          │
│  ├── MapScreen (Mapbox)                                      │
│  ├── ChatPanel (useChat from AI SDK)                         │
│  ├── DriveDetect (Background location)                       │
│  └── expo-notifications (Push)                               │
│                                                              │
│  apps/web (Next.js)                                          │
│  ├── /api/chat (AI SDK + Tools)                              │
│  ├── /api/weather (NOAA/SMN integration)                     │
│  └── /api/push (Expo Push Service)                           │
│                                                              │
│  packages/db (Drizzle + Neon)                                │
│  └── users, push_tokens, user_locations, alert_history       │
│                                                              │
│  External Services                                           │
│  ├── OpenAI (GPT-4o for chat)                                │
│  ├── Mapbox (Maps)                                           │
│  ├── NOAA (US weather alerts)                                │
│  └── Tomorrow.io (LATAM weather alerts)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Nuevas tablas)

### push_tokens
| Column | Type | Description |
|--------|------|-------------|
| id | text | PK |
| user_id | text | FK → user.id |
| token | text | Expo push token (unique) |
| platform | text | 'ios' \| 'android' |
| created_at | timestamp | |
| updated_at | timestamp | |

### user_locations
| Column | Type | Description |
|--------|------|-------------|
| id | text | PK |
| user_id | text | FK → user.id |
| name | text | 'Casa', 'Trabajo' |
| lat | numeric | |
| lng | numeric | |
| is_primary | boolean | |
| notify_alerts | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### alert_history
| Column | Type | Description |
|--------|------|-------------|
| id | text | PK |
| user_id | text | FK → user.id |
| alert_type | text | 'hail', 'tornado', 'storm' |
| severity | text | 'extreme', 'severe', 'moderate' |
| title | text | |
| description | text | |
| source | text | 'noaa', 'smn', 'tomorrow' |
| lat | numeric | |
| lng | numeric | |
| polygon | jsonb | GeoJSON del área afectada |
| notified_at | timestamp | |
| expires_at | timestamp | |
| created_at | timestamp | |

### chat_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | text | PK |
| user_id | text | FK → user.id |
| messages | jsonb | Array de mensajes |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Roadmap de 4 Semanas

### Semana 1: Fundación + Mapa

**Día 1-2: Setup Mapbox**
- [ ] Crear cuenta Mapbox, obtener API keys
- [ ] Instalar @rnmapbox/maps en apps/native
- [ ] Configurar permisos de ubicación (iOS/Android)
- [ ] Pantalla básica con mapa + ubicación usuario

**Día 3-4: Esquema DB + API base**
- [ ] Crear tablas nuevas (push_tokens, user_locations, etc.)
- [ ] Ejecutar migraciones con Drizzle
- [ ] Endpoint GET /api/weather/alerts
- [ ] Integrar NOAA API (USA)

**Día 5: Mostrar alertas en mapa**
- [ ] Fetch alertas desde API
- [ ] Dibujar polígonos de alerta en Mapbox
- [ ] Colores por severidad (rojo/naranja/amarillo)

### Semana 2: Chat AI + Tools

**Día 1-2: Setup AI SDK**
- [ ] Instalar ai, @ai-sdk/react, @ai-sdk/openai
- [ ] Crear /api/chat endpoint con tools
- [ ] Implementar useChat en native con expoFetch
- [ ] UI del chat panel (input + mensajes)

**Día 3-4: Implementar Tools**
- [ ] Tool: getWeatherAlerts
- [ ] Tool: getUserLocation
- [ ] Tool: showAlertOnMap (actualiza estado del mapa)
- [ ] Tool: analyzeRoute (básico)

**Día 5: Integración mapa ↔ chat**
- [ ] Chat puede comandar el mapa
- [ ] Respuestas del agente con contexto visual
- [ ] Testing del flujo completo

### Semana 3: Push Notifications + LATAM

**Día 1-2: Push Notifications**
- [ ] Configurar expo-notifications
- [ ] Endpoint para registrar push tokens
- [ ] Servicio de envío de push (Expo Push API)
- [ ] Trigger: nueva alerta severa → push

**Día 3-4: Weather APIs LATAM**
- [ ] Integrar Tomorrow.io (free tier)
- [ ] Integrar SMN Argentina (CAP format)
- [ ] Unificar formato de alertas
- [ ] Detectar región del usuario automáticamente

**Día 5: Testing + Polish**
- [ ] Test push en dispositivo real
- [ ] Test alertas USA vs LATAM
- [ ] Mejorar prompts del agente

### Semana 4: Detección de Manejo + Polish

**Día 1-2: Driving Detection**
- [ ] Background location tracking
- [ ] Detectar velocidad > 15 km/h
- [ ] Activar modo conducción automáticamente
- [ ] UI simplificada para conducción

**Día 3-4: Voice + UX**
- [ ] Input por voz (expo-speech o similar)
- [ ] Respuestas TTS del agente
- [ ] Animaciones y transiciones
- [ ] Manejo de errores y estados de carga

**Día 5: Release Beta**
- [ ] Build para TestFlight (iOS)
- [ ] Build para Play Console (Android)
- [ ] Testing con usuarios reales
- [ ] Documentación básica

---

## Dependencias Requeridas

### Cuentas y API Keys
| Servicio | Propósito | Costo |
|----------|-----------|-------|
| Mapbox | Mapas + geocoding | Free tier |
| OpenAI | GPT-4o para el agente | Pay per use |
| NOAA | Alertas clima USA | Gratis |
| Tomorrow.io | Alertas clima LATAM | Free tier |
| Expo (EAS) | Push notifications + builds | Free tier |

### Variables de Entorno
```bash
# Mapbox
MAPBOX_ACCESS_TOKEN=pk.xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Weather APIs
TOMORROW_IO_API_KEY=xxx

# Expo
EXPO_ACCESS_TOKEN=xxx
```

### Paquetes a Instalar
```bash
# apps/native
pnpm add @rnmapbox/maps expo-location expo-notifications expo-speech

# apps/web
pnpm add ai @ai-sdk/openai @ai-sdk/react
```

---

## Decisiones Técnicas

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| UI Pattern | Mapa + Chat fijo | AI-first experience |
| AI Framework | Vercel AI SDK | Soporte nativo Expo, tools built-in |
| LLM | GPT-4o | Balance costo/calidad |
| Maps | Mapbox | Offline support futuro, customización |
| Weather US | NOAA | Gratis, datos oficiales |
| Weather LATAM | Tomorrow.io | Cobertura global, free tier |
| Push | Expo Push | Integrado con Expo, simple |
| Background | expo-location | Geofencing + speed detection |

---

## Fuera del Alcance MVP

- CarPlay / Android Auto
- Critical Alerts (requiere aprobación Apple)
- Búsqueda de refugios/shelters
- Modo offline completo
- ElectricSQL sync
- Subscripciones/monetización
- Dashboard B2B
