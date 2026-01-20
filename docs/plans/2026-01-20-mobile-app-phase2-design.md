# Advia Mobile App - Phase 2: Real Data Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

## Overview

This phase removes mocks and implements real data flow, APIs, icons, internationalization, and UX improvements for the Advia mobile weather app.

## Goals

1. Replace all mock data with real API calls via oRPC
2. Add internationalization (English/Spanish) for web and native
3. Replace emoji icons with Hugeicons
4. Fix ad banner UX (move above map)
5. Improve welcome flow and login incentives
6. Implement data persistence with TanStack Query

---

## Architecture Decisions

### 1. Data Sync Strategy

**Decision:** TanStack Query + `persistQueryClient` with AsyncStorage

- Queries cached locally for offline viewing
- Automatic refetch when online
- Optimistic updates for better UX
- Simple to implement, easy to migrate to Electric later if needed

### 2. Internationalization

**Decision:** Shared package `@advia/i18n` with i18next

```
packages/
  i18n/
    src/
      index.ts          # Setup and exports
      locales/
        en.json         # English translations
        es.json         # Spanish translations
```

- `react-i18next` for both web and native
- Single source of truth for translations
- `expo-localization` to detect device language on native

### 3. Chat Implementation

**Decision:** oRPC streaming + ai-sdk-tools with Drizzle provider

- oRPC handles streaming via `streamToEventIterator`
- ai-sdk-tools provides:
  - Working Memory (agent context)
  - Conversation History (automatic)
  - Chat Persistence (sessions, titles)
- Drizzle provider connects to existing Postgres DB
- No custom chat_sessions implementation needed

### 4. Icons

**Decision:** `@hugeicons/react-native`

Same API as web, drop-in replacement for emojis.

### 5. Trial Duration

**Change:** 7 days → 3 days

Shorter trial creates urgency while still giving enough time to experience value.

---

## API Structure (oRPC)

### User Router

```typescript
// packages/api/src/routers/user.ts
user.getProfile()        // Get logged-in user data
user.updateSettings()    // Update theme, language, notifications
user.getStats()          // Storms avoided, money saved, km traveled
```

### Locations Router

```typescript
// packages/api/src/routers/locations.ts
locations.list()         // User's saved locations
locations.create()       // Add new location
locations.update()       // Modify location
locations.delete()       // Remove location
locations.setPrimary()   // Set as primary location
```

### Routes Router

```typescript
// packages/api/src/routers/routes.ts
routes.list()            // Saved routes
routes.create()          // Save new route
routes.getHistory()      // Trip history with stats
routes.delete()          // Remove route
```

### Alerts Router

```typescript
// packages/api/src/routers/alerts.ts
alerts.getActive()       // Active alerts for a zone (lat/lng)
alerts.getHistory()      // User's alert history
```

### Chat Router

```typescript
// packages/api/src/routers/chat.ts
chat.send()              // Streaming chat with AI (uses ai-sdk-tools)
chat.getSessions()       // List past conversations
chat.getSession()        // Get specific session messages
```

---

## UI/UX Changes

### 1. Ad Banner Relocation

**Before:** Fixed at bottom, overlaps with bottom sheet

**After:** Fixed below header, above map

```
┌─────────────────────────┐
│ Header: Advia    📍     │
├─────────────────────────┤
│ [    Ad Banner    ]     │  ← New position
├─────────────────────────┤
│                         │
│         Map             │
│                         │
├─────────────────────────┤
│    Bottom Sheet         │
└─────────────────────────┘
│  Tab Bar                │
└─────────────────────────┘
```

### 2. Welcome Screen Improvements

**Current:**
- Logo + tagline
- "Comenzar gratis" button
- "7 días con todo incluido"

**New:**
```
┌─────────────────────────┐
│                         │
│        [Logo]           │
│        Advia            │
│                         │
│  Tu co-piloto climático │
│  Evita tormentas.       │
│  Llega seguro.          │
│                         │
│  ┌───────────────────┐  │
│  │  Comenzar gratis  │  │  ← Primary CTA
│  └───────────────────┘  │
│                         │
│  3 días con todo        │
│  incluido, sin cuenta   │
│                         │
│  ─────── o ───────      │
│                         │
│  ¿Ya tienes cuenta?     │
│  Inicia sesión →        │  ← Secondary link
│                         │
└─────────────────────────┘
```

### 3. Login Incentive Modal

Triggered when anonymous user tries to:
- Save a route
- Add a location
- Access premium features

```
┌─────────────────────────┐
│         ✕               │
│                         │
│     🔐                  │
│                         │
│  Guarda tus datos       │
│                         │
│  Inicia sesión para     │
│  sincronizar rutas y    │
│  ubicaciones en todos   │
│  tus dispositivos.      │
│                         │
│  ┌───────────────────┐  │
│  │ Continuar con     │  │
│  │ Google            │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Continuar con     │  │
│  │ Apple             │  │
│  └───────────────────┘  │
│                         │
│  Continuar con email    │
│                         │
│  ─────────────────────  │
│  Continuar sin cuenta   │  ← Dismiss option
│  (datos solo locales)   │
│                         │
└─────────────────────────┘
```

---

## Icon Mapping

Replace emojis with Hugeicons:

| Location | Emoji | Hugeicon |
|----------|-------|----------|
| Tab: Mapa | 🗺️ | `Map01Icon` |
| Tab: Rutas | 📍 | `Route01Icon` |
| Tab: Perfil | 👤 | `UserIcon` |
| Stats: Tormentas | 🌩️ | `CloudLightning01Icon` |
| Stats: Dinero | 💰 | `Money01Icon` |
| Stats: Km | 🛣️ | `Road01Icon` |
| Settings: Notif | 🔔 | `Notification01Icon` |
| Settings: Ubicaciones | 📍 | `Location01Icon` |
| Settings: Tema | 🎨 | `PaintBoardIcon` |
| Settings: Idioma | 🌐 | `LanguageCircleIcon` |
| Settings: Ayuda | ❓ | `HelpCircleIcon` |
| Logout | 🚪 | `Logout01Icon` |
| Chat send | ➤ | `Send01Icon` |
| Header: Stats | 📊 | `Analytics01Icon` |
| Header: Config | ⚙️ | `Settings01Icon` |
| Alert banner arrow | → | `ArrowRight01Icon` |
| Verify email | 📧 | `Mail01Icon` |
| Premium star | ⭐ | `Star01Icon` |
| Close modal | ✕ | `Cancel01Icon` |
| Check mark | ✓ | `Tick01Icon` |
| Route status clear | ✅ | `CheckmarkCircle01Icon` |
| Route status warning | ⚠️ | `Alert01Icon` |

---

## Translation Keys Structure

```json
// packages/i18n/src/locales/es.json
{
  "common": {
    "continue": "Continuar",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "loading": "Cargando..."
  },
  "welcome": {
    "tagline": "Tu co-piloto climático",
    "subtitle": "Evita tormentas. Llega seguro.",
    "startFree": "Comenzar gratis",
    "trialInfo": "3 días con todo incluido, sin cuenta",
    "haveAccount": "¿Ya tienes cuenta?",
    "signIn": "Inicia sesión"
  },
  "auth": {
    "signInTitle": "Inicia sesión",
    "signInSubtitle": "Sincroniza tus rutas y alertas en todos tus dispositivos",
    "continueWithGoogle": "Continuar con Google",
    "continueWithApple": "Continuar con Apple",
    "continueWithEmail": "Continuar con email",
    "enterEmail": "Ingresa tu email",
    "emailPlaceholder": "tu@email.com",
    "sendMagicLink": "Enviar magic link",
    "checkEmail": "Revisa tu email",
    "magicLinkSent": "Enviamos un link de acceso a",
    "openEmailApp": "Abrir app de email",
    "useAnotherEmail": "Usar otro email"
  },
  "tabs": {
    "map": "Mapa",
    "routes": "Rutas",
    "profile": "Perfil"
  },
  "map": {
    "myZone": "Mi zona",
    "chatPlaceholder": "Escribe un mensaje...",
    "chatPrompt": "¿A dónde vas hoy?",
    "suggestions": {
      "workRoute": "Mi ruta al trabajo",
      "nearbyAlerts": "Alertas cercanas",
      "willItRain": "¿Va a llover hoy?"
    }
  },
  "alerts": {
    "extreme": "Alerta extrema",
    "severe": "Alerta severa",
    "moderate": "Alerta moderada",
    "minor": "Alerta menor"
  },
  "routes": {
    "title": "Mis Rutas",
    "addNew": "Agregar nueva ruta",
    "history": "Historial",
    "noAlerts": "Sin alertas",
    "clear": "Despejado"
  },
  "profile": {
    "title": "Perfil",
    "stats": "Estadísticas",
    "stormsAvoided": "tormentas evitadas",
    "moneySaved": "ahorrados",
    "kmTraveled": "km recorridos seguro",
    "settings": "Configuración",
    "notifications": "Notificaciones",
    "savedLocations": "Ubicaciones guardadas",
    "theme": "Tema",
    "language": "Idioma",
    "help": "Ayuda y soporte",
    "logout": "Cerrar sesión",
    "trialRemaining": "Trial: {{days}} días restantes",
    "planPremium": "Plan: Premium",
    "upgrade": "Upgrade"
  },
  "premium": {
    "title": "Advia Premium",
    "features": {
      "unlimitedRoutes": "Rutas ilimitadas",
      "realTimeAlerts": "Alertas en tiempo real",
      "noAds": "Sin anuncios",
      "refugeLocations": "Lugares de refugio",
      "fullHistory": "Historial completo",
      "multipleLocations": "Múltiples ubicaciones"
    },
    "monthly": "$4.99/mes",
    "yearly": "$39.99/año (ahorra 33%)",
    "cancelAnytime": "Cancela cuando quieras",
    "processedBy": "Pago procesado por Polar"
  },
  "loginIncentive": {
    "title": "Guarda tus datos",
    "subtitle": "Inicia sesión para sincronizar rutas y ubicaciones en todos tus dispositivos.",
    "continueWithoutAccount": "Continuar sin cuenta",
    "localDataOnly": "(datos solo locales)"
  }
}
```

English version mirrors the same structure with translations.

---

## Data Flow

### Anonymous User (Trial)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   App Start  │────▶│ Check Trial  │────▶│  Show App    │
└──────────────┘     │   Store      │     │  (3 days)    │
                     └──────────────┘     └──────────────┘
                            │
                            ▼ (expired)
                     ┌──────────────┐
                     │  Show Auth   │
                     │   Screen     │
                     └──────────────┘
```

### Logged-in User

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   App Start  │────▶│ TanStack     │────▶│  Show App    │
└──────────────┘     │ Query Cache  │     │  with data   │
                     └──────────────┘     └──────────────┘
                            │
                            ▼ (online)
                     ┌──────────────┐
                     │   Refetch    │
                     │   from API   │
                     └──────────────┘
```

### Save Action (Anonymous)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User taps   │────▶│ Check if     │────▶│   Show       │
│  "Save"      │     │  logged in   │     │   Modal      │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼ (logged in)        ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  Save via    │     │ Login / Skip │
                     │    API       │     └──────────────┘
                     └──────────────┘            │
                                                 ▼ (skip)
                                          ┌──────────────┐
                                          │ Save locally │
                                          │    only      │
                                          └──────────────┘
```

---

## File Structure (New/Modified)

```
packages/
  i18n/                          # NEW: Shared i18n package
    src/
      index.ts
      locales/
        en.json
        es.json
    package.json

  api/
    src/
      routers/
        index.ts                 # Modified: export all routers
        user.ts                  # NEW
        locations.ts             # NEW
        routes.ts                # NEW
        alerts.ts                # NEW
        chat.ts                  # NEW

apps/
  native/
    app/
      (auth)/
        welcome.tsx              # Modified: new design, 3-day trial
      (app)/
        (tabs)/
          _layout.tsx            # Modified: ad banner moved
          index.tsx              # Modified: real alerts, chat
          routes.tsx             # Modified: real data
          profile.tsx            # Modified: real data, icons
        login-incentive.tsx      # NEW: modal component
    components/
      icons.tsx                  # NEW: Hugeicons wrapper
      ad-banner.tsx              # NEW: extracted component
    hooks/
      use-require-auth.ts        # NEW: login incentive hook
    lib/
      query-client.ts            # NEW: TanStack Query setup
      i18n.ts                    # NEW: i18n setup for native
    stores/
      trial-store.ts             # Modified: 3 days

  web/
    src/
      lib/
        i18n.ts                  # NEW: i18n setup for web
```

---

## Dependencies to Add

### Native (`apps/native/package.json`)

```json
{
  "@hugeicons/react-native": "^0.3.0",
  "@hugeicons/core-free-icons": "^0.1.0",
  "@tanstack/query-async-storage-persister": "^5.0.0",
  "@tanstack/react-query-persist-client": "^5.0.0",
  "expo-localization": "~16.0.0",
  "react-i18next": "^14.0.0",
  "i18next": "^24.0.0",
  "@advia/i18n": "workspace:*"
}
```

### Web (`apps/web/package.json`)

```json
{
  "react-i18next": "^14.0.0",
  "i18next": "^24.0.0",
  "@advia/i18n": "workspace:*"
}
```

### API (`packages/api/package.json`)

```json
{
  "ai-sdk-tools": "^1.0.0"
}
```

---

## Success Criteria

- [ ] All emojis replaced with Hugeicons
- [ ] Ad banner displays above map, doesn't overlap sheet
- [ ] Welcome screen shows 3-day trial + login link
- [ ] Login incentive modal appears when saving (anonymous)
- [ ] App works in English and Spanish
- [ ] Profile shows real user data when logged in
- [ ] Routes/Locations sync between devices
- [ ] Chat persists conversation history
- [ ] Offline mode shows cached data

---

## Next Steps

1. Create implementation plan with `superpowers:writing-plans`
2. Prioritize order: i18n setup → icons → APIs → UI changes
3. Implement incrementally with tests
