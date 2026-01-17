# ADVIA - Spec Driven Development Document
## AI-Powered Storm Alert & Shelter Finder App

---

# 📋 Document Control

| Field | Value |
|-------|-------|
| **Product Name** | Advia |
| **Tagline** | "Your AI Storm Advisor" |
| **Version** | 1.0 |
| **Last Updated** | January 2025 |
| **Author** | Lucas |
| **Status** | Draft |

---

# 🎯 Executive Summary

## Vision Statement

> "Advia es la primera app que no solo te alerta del clima peligroso, sino que te dice DÓNDE refugiarte y te guía hasta ahí."

## Problem Statement

Los conductores enfrentan tormentas de granizo y clima severo sin tiempo de reacción suficiente. Las apps de clima existentes alertan del peligro pero NO resuelven el problema completo: ¿dónde refugiarse? El resultado: miles de vehículos dañados anualmente ($5,000-15,000 por incidente) y riesgo para la integridad de las personas.

## Solution

Una app móvil que:
1. **Alerta** con anticipación de clima peligroso en tu ruta
2. **Recomienda** refugios cercanos usando AI on-device
3. **Guía** hasta el refugio más conveniente
4. **Funciona offline** con datos pre-cargados

## Target Users

| Segmento | Descripción | Prioridad |
|----------|-------------|-----------|
| Conductores urbanos | Viajan diariamente en zonas de granizo frecuente | P0 |
| Viajeros de ruta | Road trips, viajes largos entre ciudades | P1 |
| Flotas comerciales | Camiones, delivery, transporte | P1 |
| Propietarios de autos premium | Autos nuevos o de colección | P2 |

## Success Metrics

| Metric | Target MVP | Target 1 Year |
|--------|------------|---------------|
| Downloads | 5,000 | 100,000 |
| MAU | 1,000 | 50,000 |
| Conversion (free→paid) | 2% | 4% |
| Churn mensual | <10% | <5% |
| App Store Rating | 4.0+ | 4.5+ |
| Alertas enviadas/mes | 1,000 | 100,000 |
| "Saves" reportados | 50 | 5,000 |

---

# 🏗️ Technical Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADVIA ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    TURBOREPO MONOREPO                          │ │
│  │                                                                │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │ │
│  │  │  apps/mobile    │  │   apps/web      │  │ apps/dashboard│  │ │
│  │  │  (Expo)         │  │   (Next.js)     │  │ (Next.js)     │  │ │
│  │  │                 │  │   Landing +     │  │ B2B Fleet     │  │ │
│  │  │  - iOS          │  │   Marketing     │  │ Management    │  │ │
│  │  │  - Android      │  │                 │  │               │  │ │
│  │  └─────────────────┘  └─────────────────┘  └───────────────┘  │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │                    packages/                             │  │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐  │  │ │
│  │  │  │   api   │ │   db    │ │   ui    │ │    config     │  │  │ │
│  │  │  │(tRPC/   │ │(Drizzle │ │(Shared  │ │ (TS, ESLint,  │  │  │ │
│  │  │  │ Next.js)│ │ + Neon) │ │ comps)  │ │  Tailwind)    │  │  │ │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └───────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      EXTERNAL SERVICES                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │ NeonTech │ │ Electric │ │  Mapbox  │ │  Weather APIs    │  │ │
│  │  │ Postgres │ │   SQL    │ │  Maps    │ │  NOAA/Tomorrow   │  │ │
│  │  │          │ │  (Sync)  │ │          │ │                  │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | Turborepo | Build system, task orchestration |
| **Mobile App** | Expo SDK 53+ (Dev Build) | Cross-platform mobile |
| **Web/API** | Next.js 15 (App Router) | Landing, API routes, dashboard |
| **Database** | NeonTech (Serverless Postgres) | Primary data store |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Sync** | ElectricSQL | Offline-first local-first sync |
| **Auth** | Better-Auth | Authentication across all platforms |
| **Data Fetching** | TanStack Query | Caching, mutations, sync state |
| **Maps** | Mapbox (@rnmapbox/maps) | Maps with offline support |
| **ML** | TensorFlow Lite | On-device inference |
| **Styling** | Tailwind + NativeWind | Consistent styling |

## Monorepo Structure

```
advia/
├── apps/
│   ├── mobile/                 # Expo app
│   │   ├── app/               # Expo Router pages
│   │   ├── components/        # Mobile-specific components
│   │   ├── features/          # Feature modules
│   │   ├── lib/               # Mobile utilities
│   │   └── assets/            # Images, fonts, ML models
│   │
│   ├── web/                   # Next.js marketing site
│   │   ├── app/               # App Router pages
│   │   └── components/        # Web components
│   │
│   └── dashboard/             # Next.js B2B dashboard
│       ├── app/               # App Router pages
│       └── components/        # Dashboard components
│
├── packages/
│   ├── api/                   # Shared API layer
│   │   ├── routers/          # tRPC or API routes
│   │   └── services/         # Business logic
│   │
│   ├── db/                    # Database package
│   │   ├── schema/           # Drizzle schema definitions
│   │   ├── migrations/       # Database migrations
│   │   └── seed/             # Seed data
│   │
│   ├── auth/                  # Better-Auth configuration
│   │   └── config/           # Auth providers, sessions
│   │
│   ├── ui/                    # Shared UI components
│   │   ├── components/       # Cross-platform components
│   │   └── primitives/       # Base primitives
│   │
│   ├── electric/              # ElectricSQL configuration
│   │   ├── shapes/           # Sync shapes definitions
│   │   └── client/           # Electric client setup
│   │
│   └── config/                # Shared configuration
│       ├── typescript/       # TSConfig presets
│       ├── eslint/           # ESLint presets
│       └── tailwind/         # Tailwind presets
│
├── tooling/                   # Build tooling
├── turbo.json                 # Turborepo config
└── package.json               # Root package.json
```

---

# 📅 Development Phases

## Phase Overview

| Phase | Name | Duration | Main Deliverable | Value Delivered |
|-------|------|----------|------------------|-----------------|
| 0 | Foundation | 2 weeks | Monorepo setup, CI/CD | Dev infrastructure |
| 1 | MVP Core | 4 weeks | Basic alerts + map | Validates core hypothesis |
| 2 | Shelter Finder | 3 weeks | POI recommendations | Key differentiator |
| 3 | Offline & Sync | 3 weeks | Offline-first experience | Reliability |
| 4 | ML & Intelligence | 3 weeks | Smart recommendations | AI differentiation |
| 5 | Premium & Monetization | 2 weeks | Subscriptions, paywall | Revenue |
| 6 | CarPlay & Advanced | 3 weeks | CarPlay, critical alerts | Premium features |
| 7 | B2B Dashboard | 4 weeks | Fleet management | Enterprise revenue |

**Total Estimated Duration: 24 weeks (~6 months)**

---

# 🔷 PHASE 0: Foundation
## Duration: 2 weeks

### Objectives
- Set up Turborepo monorepo structure
- Configure all packages and apps
- Establish CI/CD pipeline
- Set up NeonTech database with Drizzle
- Configure Better-Auth
- Create design system base

### Deliverables

#### P0.1 - Monorepo Initialization

**Tasks:**
- Initialize Turborepo with recommended structure
- Configure TypeScript with strict mode across all packages
- Set up path aliases for clean imports
- Configure ESLint + Prettier with shared rules
- Set up Husky for pre-commit hooks
- Initialize Git repository with conventional commits

**Package Dependencies:**
- Root: turborepo, typescript, eslint, prettier
- Shared tsconfig, eslint-config packages

#### P0.2 - Database Setup (packages/db)

**Tasks:**
- Create NeonTech project and database
- Configure Drizzle ORM with NeonTech driver
- Define initial schema:
  - `users` table
  - `user_locations` table (saved places)
  - `weather_alerts` table
  - `shelters` table (POIs)
- Set up Drizzle Kit for migrations
- Create seed scripts for development
- Configure connection pooling

**Schema Requirements:**
- Users: id, email, name, avatar_url, subscription_tier, subscription_expires_at, settings (jsonb), created_at, updated_at
- User Locations: id, user_id (FK), name, lat, lng, is_primary, notifications_enabled, created_at
- Weather Alerts: id, type, severity, title, description, instructions, polygon (geometry), starts_at, expires_at, source, region_id, created_at
- Shelters: id, osm_id, name, category, subcategory, lat, lng, is_covered, coverage_type, address, phone, opening_hours, amenities (jsonb), avg_rating, total_ratings, verified_at, region_id, created_at, updated_at

#### P0.3 - Authentication Setup (packages/auth)

**Tasks:**
- Configure Better-Auth with NeonTech adapter
- Set up authentication providers:
  - Email/Password
  - Google OAuth
  - Apple Sign-In (for iOS)
- Configure session management
- Set up JWT tokens for API authentication
- Create auth middleware for Next.js
- Create auth hooks for Expo

**Requirements:**
- Secure session handling
- Token refresh mechanism
- Cross-platform compatibility (web + mobile)
- Social login support

#### P0.4 - API Layer Setup (packages/api)

**Tasks:**
- Set up Next.js API routes structure
- Configure TanStack Query client
- Create API client for mobile app
- Set up error handling and validation
- Configure CORS for mobile access
- Create base service classes

**API Structure:**
- `/api/auth/*` - Authentication endpoints (Better-Auth)
- `/api/weather/*` - Weather data endpoints
- `/api/shelters/*` - Shelter/POI endpoints
- `/api/users/*` - User management endpoints

#### P0.5 - ElectricSQL Setup (packages/electric)

**Tasks:**
- Set up ElectricSQL service
- Configure sync shapes for offline data:
  - Shelters by region
  - User's saved locations
  - Cached weather alerts
- Set up local SQLite database for mobile
- Configure sync rules and permissions
- Test bidirectional sync

**Sync Shapes Required:**
- `shelters_by_region`: Syncs shelters within user's downloaded regions
- `user_data`: Syncs user's locations and preferences
- `active_alerts`: Syncs weather alerts for user's regions

#### P0.6 - CI/CD Setup

**Tasks:**
- Configure GitHub Actions workflows:
  - Lint and typecheck on PR
  - Build all apps on PR
  - Deploy preview on PR (Vercel)
  - Deploy production on merge to main
- Set up EAS Build for Expo
- Configure environment variables in CI
- Set up Sentry for error tracking
- Configure Turbo remote caching

**Workflows:**
- `ci.yml`: Runs on every PR (lint, typecheck, test, build)
- `preview.yml`: Deploys preview builds
- `production.yml`: Deploys to production
- `mobile-build.yml`: Builds iOS/Android via EAS

#### P0.7 - Design System (packages/ui)

**Tasks:**
- Configure Tailwind with shared preset
- Configure NativeWind for mobile
- Define color palette (brand, severity, neutral, weather)
- Create typography scale
- Build base components:
  - Button (primary, secondary, ghost, danger variants)
  - Input (text, password, search)
  - Card
  - Badge (alert severity colors)
  - Modal/BottomSheet
  - Toast/Alert
- Set up dark mode support
- Document components

**Color System:**
- Brand: primary (blue), secondary (green)
- Severity: extreme (red), severe (orange), moderate (yellow), minor (green)
- Weather: rain (blue), hail (purple), storm (pink), clear (yellow)
- Neutral: background, surface, text, text-muted, border

### Acceptance Criteria - Phase 0

| ID | Criteria | Priority |
|----|----------|----------|
| P0-AC1 | `turbo dev` starts all apps without errors | P0 |
| P0-AC2 | Mobile app builds for iOS and Android | P0 |
| P0-AC3 | Database migrations run successfully | P0 |
| P0-AC4 | Auth flow works (signup, login, logout) | P0 |
| P0-AC5 | API endpoints respond correctly | P0 |
| P0-AC6 | ElectricSQL syncs test data | P0 |
| P0-AC7 | PR triggers CI pipeline | P0 |
| P0-AC8 | Design system components render correctly | P1 |
| P0-AC9 | Preview deployment works | P1 |

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API Style | REST with TanStack Query | Simpler than tRPC for mobile, good caching |
| Auth Storage | Secure storage (mobile), HTTP-only cookies (web) | Security best practices |
| Sync Strategy | ElectricSQL shapes | Real-time sync with offline support |
| Styling | Tailwind + NativeWind | Consistent across platforms |

---

# 🔷 PHASE 1: MVP Core
## Duration: 4 weeks

### Objectives
- Display weather map with radar layer
- Show current weather alerts for user location
- Send push notifications for severe weather
- Complete authentication flow in mobile app
- Basic user settings

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-1.1 | As a user, I want to see a map with my current location so I can orient myself | P0 | 3 |
| US-1.2 | As a user, I want to see weather radar overlay on the map so I can visualize incoming storms | P0 | 5 |
| US-1.3 | As a user, I want to receive a list of active weather alerts for my area so I can stay informed | P0 | 5 |
| US-1.4 | As a user, I want to receive push notifications for severe weather so I don't miss critical alerts | P0 | 5 |
| US-1.5 | As a user, I want to sign up / log in so my preferences are saved across devices | P0 | 3 |
| US-1.6 | As a user, I want to save my home/work locations so I receive relevant alerts | P1 | 3 |
| US-1.7 | As a user, I want to configure which alert types I receive | P1 | 2 |
| US-1.8 | As a new user, I want an onboarding flow that explains the app and requests permissions | P0 | 3 |

### Features Specification

#### F1.1 - Weather Map

**Requirements:**
- Display Mapbox map centered on user's location
- Show user's current position with marker
- Support pinch-to-zoom and pan gestures
- Smooth animations for map movements
- Dark mode map style by default

**Radar Layer:**
- Integrate OpenWeatherMap precipitation tiles
- Toggle radar visibility on/off
- Radar opacity: 70%
- Auto-refresh every 5 minutes
- Show radar animation (last 2 hours) on demand

**Performance:**
- Map load time < 3 seconds
- Smooth 60fps interactions
- Efficient tile caching

#### F1.2 - Weather Alerts System

**Data Sources:**
- NOAA Weather API (USA) - Free
- Tomorrow.io (LATAM, Europe) - Paid
- SMN Argentina (Argentina) - Free/CAP format

**Alert Types Supported:**
- Tornado
- Severe Thunderstorm
- Hail
- Flash Flood
- Hurricane/Tropical Storm
- Winter Storm
- Extreme Wind
- Extreme Heat/Cold

**Alert Data Model:**
- ID, type, severity (extreme/severe/moderate/minor)
- Title, description, instructions
- Affected area (GeoJSON polygon)
- Start time, expiration time
- Source provider
- Region ID

**Alert Processing:**
- Fetch alerts every 5 minutes
- Match user location against alert polygons
- Deduplicate alerts from multiple sources
- Store alerts in local database via ElectricSQL

#### F1.3 - Push Notifications

**Configuration:**
- Use expo-notifications
- Request permissions during onboarding
- Configure notification channels (Android):
  - `severe-weather`: High importance, sound + vibration
  - `weather-updates`: Default importance
- Configure notification categories (iOS)

**Notification Triggers:**
- New alert affects user's location
- Alert severity upgrade
- Alert approaching user's route (Phase 4)

**Notification Content:**
- Title: Alert type + severity icon
- Body: Brief description + ETA if applicable
- Data payload: alert ID, type, severity, deep link
- Sound: Custom sound for severe/extreme

#### F1.4 - Authentication Flow

**Screens:**
- Welcome/splash
- Login (email + social)
- Register (email + social)
- Forgot password
- Email verification

**Requirements:**
- Better-Auth integration
- Secure token storage (expo-secure-store)
- Auto-login on app restart
- Session refresh mechanism
- Logout from all devices option

#### F1.5 - Onboarding Flow

**Screens:**
1. Welcome - Value proposition
2. Location Permission - Request + explain why
3. Notification Permission - Request + explain why
4. Primary Location - Set home/current location
5. Alert Preferences - Select alert types
6. Complete - Ready to use

**Requirements:**
- Skip option for non-critical steps
- Progress indicator
- Smooth animations between steps
- Save progress if interrupted

### Screens - Phase 1

**Mobile App (Expo Router):**
```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx          # Map (home)
│   ├── alerts.tsx         # Alerts list
│   └── settings.tsx       # Settings
├── onboarding/
│   ├── index.tsx          # Welcome
│   ├── permissions.tsx    # Location + notifications
│   ├── location.tsx       # Set primary location
│   └── preferences.tsx    # Alert preferences
├── alert/
│   └── [id].tsx           # Alert detail
└── _layout.tsx            # Root layout
```

### API Endpoints - Phase 1

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/auth/register` | POST | Register new user |
| `POST /api/auth/login` | POST | Login user |
| `POST /api/auth/logout` | POST | Logout user |
| `GET /api/auth/session` | GET | Get current session |
| `GET /api/users/me` | GET | Get current user profile |
| `PATCH /api/users/me` | PATCH | Update user profile |
| `GET /api/users/me/locations` | GET | Get saved locations |
| `POST /api/users/me/locations` | POST | Add saved location |
| `DELETE /api/users/me/locations/:id` | DELETE | Remove saved location |
| `GET /api/weather/alerts` | GET | Get alerts for location (lat, lng, radius) |
| `GET /api/weather/alerts/:id` | GET | Get alert details |
| `GET /api/weather/conditions` | GET | Get current conditions for location |

### UI Wireframes - Phase 1

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  HOME (MAP)                 │    │  ALERTS LIST                │
├─────────────────────────────┤    ├─────────────────────────────┤
│  ≡  ADVIA           📍 ⚙️  │    │  ← Alertas                  │
│                             │    │                             │
│   ┌───────────────────┐     │    │  Activas (2)                │
│   │                   │     │    │  ┌─────────────────────┐    │
│   │    MAP + RADAR    │     │    │  │ 🔴 Alerta de Granizo│    │
│   │                   │     │    │  │ Córdoba Centro      │    │
│   │                   │     │    │  │ Expira en 45 min    │    │
│   │       📍          │     │    │  └─────────────────────┘    │
│   │     (user)        │     │    │  ┌─────────────────────┐    │
│   │                   │     │    │  │ 🟡 Tormenta Eléctrica│   │
│   └───────────────────┘     │    │  │ Zona Norte          │    │
│                             │    │  │ Expira en 2 horas   │    │
│  ┌─────────────────────┐    │    │  └─────────────────────┘    │
│  │ ⚠️ 2 Alertas Activas│    │    │                             │
│  │ Toca para ver       │    │    │  Recientes                  │
│  └─────────────────────┘    │    │  (historial últimas 24h)    │
│                             │    │                             │
├─────────────────────────────┤    ├─────────────────────────────┤
│   🗺️        ⚠️        ⚙️   │    │   🗺️        ⚠️        ⚙️   │
│   Mapa    Alertas  Config   │    │   Mapa    Alertas  Config   │
└─────────────────────────────┘    └─────────────────────────────┘

┌─────────────────────────────┐    ┌─────────────────────────────┐
│  ALERT DETAIL               │    │  SETTINGS                   │
├─────────────────────────────┤    ├─────────────────────────────┤
│  ←                          │    │  ← Configuración            │
│                             │    │                             │
│  🔴 ALERTA DE GRANIZO       │    │  Cuenta                     │
│  Severidad: SEVERA          │    │  ┌─────────────────────┐    │
│                             │    │  │ 👤 Lucas            │    │
│  ┌───────────────────┐      │    │  │ lucas@email.com     │    │
│  │   MAPA CON ZONA   │      │    │  └─────────────────────┘    │
│  │   AFECTADA        │      │    │                             │
│  └───────────────────┘      │    │  Notificaciones             │
│                             │    │  ├─ Alertas severas    [ON] │
│  📍 Afecta tu ubicación     │    │  ├─ Alertas moderadas  [ON] │
│  ⏱️ Expira: 14:30           │    │  └─ Alertas menores   [OFF]│
│  📏 Distancia: 2.3 km       │    │                             │
│                             │    │  Ubicaciones                │
│  Instrucciones:             │    │  ├─ 🏠 Casa (Principal)     │
│  Busque refugio bajo techo  │    │  ├─ 🏢 Trabajo             │
│  cubierto. Evite ventanas.  │    │  └─ [+ Agregar]            │
│                             │    │                             │
│  [  🛡️ Buscar Refugio  ]    │    │  Sobre Advia               │
│                             │    │  Cerrar Sesión              │
└─────────────────────────────┘    └─────────────────────────────┘
```

### Acceptance Criteria - Phase 1

| ID | Criteria | Priority |
|----|----------|----------|
| P1-AC1 | Map displays with user location centered | P0 |
| P1-AC2 | Radar layer toggles on/off | P0 |
| P1-AC3 | Alerts fetch from weather APIs | P0 |
| P1-AC4 | Alerts display in list with severity colors | P0 |
| P1-AC5 | Push notification received for new severe alert | P0 |
| P1-AC6 | User can sign up with email | P0 |
| P1-AC7 | User can log in with email | P0 |
| P1-AC8 | User can log in with Google | P1 |
| P1-AC9 | Onboarding flow completes successfully | P0 |
| P1-AC10 | Location permission requested and handled | P0 |
| P1-AC11 | User can save multiple locations | P1 |
| P1-AC12 | Settings persist across sessions | P0 |
| P1-AC13 | App works on iOS and Android | P0 |
| P1-AC14 | Deep link to alert works from notification | P1 |

### Definition of Done - Phase 1

- [ ] All P0 acceptance criteria pass
- [ ] Unit tests for business logic (>70% coverage)
- [ ] E2E tests for critical flows (auth, alerts)
- [ ] App published to TestFlight (iOS)
- [ ] App published to Play Console Beta (Android)
- [ ] API documentation complete
- [ ] Analytics events tracked (signup, alert_view, notification_tap)
- [ ] Error tracking active (Sentry)
- [ ] 50+ beta testers have used the app
- [ ] Feedback collected and triaged

---

# 🔷 PHASE 2: Shelter Finder
## Duration: 3 weeks

### Objectives
- Display nearby shelters/refuges on map
- Categorize shelters by type
- Calculate distance and ETA to each shelter
- Enable navigation to selected shelter
- Allow users to save favorite shelters

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-2.1 | As a user, I want to see nearby shelters on the map so I know where I can take cover | P0 | 5 |
| US-2.2 | As a user, I want to filter shelters by type (gas station, parking, mall) so I find my preferred refuge | P1 | 3 |
| US-2.3 | As a user, I want to see distance and ETA to each shelter so I can make informed decisions | P0 | 3 |
| US-2.4 | As a user, I want to get directions to a shelter using my preferred navigation app | P0 | 3 |
| US-2.5 | As a user, I want to save favorite shelters so I can quickly find them again | P2 | 2 |
| US-2.6 | As a user, I want to see if a shelter is covered/has roof so I know it will protect my vehicle | P0 | 2 |
| US-2.7 | As a user, I want to see shelter ratings from other users | P2 | 3 |

### Features Specification

#### F2.1 - Shelter Database

**Data Sources:**
- OpenStreetMap via Geofabrik extracts (primary)
- Manual curation for high-value locations
- User contributions (future)

**Shelter Categories:**
| Category | OSM Tags | Icon |
|----------|----------|------|
| Fuel Station | `amenity=fuel` | ⛽ |
| Covered Parking | `amenity=parking` + `covered=yes` | 🅿️ |
| Shopping Mall | `shop=mall` | 🏬 |
| Supermarket | `shop=supermarket` | 🛒 |
| Hospital | `amenity=hospital` | 🏥 |
| Bus Station | `amenity=bus_station` | 🚌 |
| Bridge/Overpass | `man_made=bridge` | 🌉 |
| Public Shelter | `amenity=shelter` | 🏠 |

**Shelter Data Model:**
- ID, osm_id
- Name, category, subcategory
- Coordinates (lat, lng)
- Coverage: is_covered, coverage_type (full/partial/none)
- Capacity (small/medium/large/unknown)
- Address, phone, website
- Opening hours
- Amenities (jsonb array)
- Ratings: avg_rating, total_ratings
- Verification: verified_at, verified_by
- Region ID (for sync/download)

**Data Pipeline:**
1. Download PBF extracts from Geofabrik (per region)
2. Filter using osmium for relevant tags
3. Convert to GeoJSON
4. Enrich with coverage estimation
5. Import to NeonTech database
6. Sync to mobile via ElectricSQL

#### F2.2 - Shelter Display

**Map Markers:**
- Custom markers by category (emoji or custom icons)
- Marker clustering for zoomed-out views
- Selected state highlight
- Callout on tap showing name + distance

**Shelter List:**
- Bottom sheet / drawer showing nearby shelters
- Sorted by distance (default) or rating
- Filter chips for categories
- Pull to refresh
- Infinite scroll for more results

**Shelter Card:**
- Name and category icon
- Distance (meters/km)
- ETA (walking/driving)
- Coverage indicator (✅ Techado)
- Rating (if available)
- "Navigate" CTA button

#### F2.3 - Distance & ETA Calculation

**Requirements:**
- Calculate straight-line distance to all shelters
- Calculate driving ETA via Mapbox Directions API
- Batch requests using Mapbox Matrix API (up to 25 destinations)
- Cache ETA calculations (5 min TTL)
- Show ETA in minutes (< 60 min) or hours

**Display:**
- "📍 800m • ⏱️ 3 min" format
- Update on user location change
- Highlight shelters reachable before storm arrives (when alert active)

#### F2.4 - Navigation Integration

**Supported Apps:**
- Google Maps
- Apple Maps
- Waze

**Flow:**
1. User taps "Navigate" on shelter card
2. Show action sheet with available navigation apps
3. Open selected app with destination coordinates
4. Track navigation_started event

**Fallback:**
- If no navigation apps installed, open web maps

### API Endpoints - Phase 2

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/shelters` | GET | Get shelters near location |
| `GET /api/shelters/:id` | GET | Get shelter details |
| `POST /api/shelters/:id/rate` | POST | Rate a shelter |
| `GET /api/users/me/favorites` | GET | Get user's favorite shelters |
| `POST /api/users/me/favorites` | POST | Add shelter to favorites |
| `DELETE /api/users/me/favorites/:id` | DELETE | Remove from favorites |

**Query Parameters for GET /api/shelters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius`: Search radius in meters (default: 10000)
- `categories`: Comma-separated category filter
- `only_covered`: Boolean, filter covered only
- `limit`: Max results (default: 20)

### UI Wireframes - Phase 2

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  MAP + SHELTERS             │    │  SHELTER DETAIL             │
├─────────────────────────────┤    ├─────────────────────────────┤
│  ≡  ADVIA           🔍 ⚙️  │    │  ←                     ❤️   │
│                             │    │                             │
│   ┌───────────────────┐     │    │  ⛽ Shell Av. Colón         │
│   │    ⛽        🅿️   │     │    │  Estación de Servicio      │
│   │         📍       │     │    │  ★★★★☆ (47 reseñas)        │
│   │    🏬      ⛽    │     │    │                             │
│   │        🅿️        │     │    │  ┌───────────────────┐      │
│   └───────────────────┘     │    │  │   MINI MAPA       │      │
│                             │    │  └───────────────────┘      │
│  Filtrar: [Todos ▼]         │    │                             │
│                             │    │  📍 800 metros              │
│  ╔═════════════════════╗    │    │  ⏱️ 3 min en auto          │
│  ║ Refugios Cercanos   ║    │    │  ✅ Techado completo       │
│  ╠═════════════════════╣    │    │  🕐 Abierto 24 horas       │
│  ║ ⛽ Shell Av. Colón  ║    │    │                             │
│  ║ 800m • 3 min   [→]  ║    │    │  Servicios:                │
│  ║ ✅ Techado          ║    │    │  • Estacionamiento amplio  │
│  ╠═════════════════════╣    │    │  • Tienda de conveniencia  │
│  ║ 🅿️ Parking Centro   ║    │    │  • Baños                   │
│  ║ 1.2km • 5 min  [→]  ║    │    │                             │
│  ║ ✅ Techado          ║    │    │  ┌─────────────────────┐    │
│  ╚═════════════════════╝    │    │  │   🧭 NAVEGAR        │    │
│                             │    │  └─────────────────────┘    │
├─────────────────────────────┤    │                             │
│   🗺️        ⚠️        ⚙️   │    │  Abrir con: Maps • Waze    │
└─────────────────────────────┘    └─────────────────────────────┘
```

### Acceptance Criteria - Phase 2

| ID | Criteria | Priority |
|----|----------|----------|
| P2-AC1 | Shelter markers display on map | P0 |
| P2-AC2 | Markers clustered when zoomed out | P1 |
| P2-AC3 | Shelters list shows in bottom sheet | P0 |
| P2-AC4 | Shelters sorted by distance | P0 |
| P2-AC5 | Filter by category works | P1 |
| P2-AC6 | Distance calculated for each shelter | P0 |
| P2-AC7 | ETA calculated via Mapbox API | P0 |
| P2-AC8 | Tap marker shows shelter card | P0 |
| P2-AC9 | "Navigate" opens action sheet | P0 |
| P2-AC10 | Navigation opens in external app | P0 |
| P2-AC11 | User can save/unsave favorites | P2 |
| P2-AC12 | Favorites persist via sync | P2 |
| P2-AC13 | Coverage indicator shows correctly | P0 |

### Definition of Done - Phase 2

- [ ] All P0 acceptance criteria pass
- [ ] POI data imported for 5 major cities
- [ ] Shelter search < 2 seconds
- [ ] ETA calculation batch optimized
- [ ] Unit tests for distance/ETA logic
- [ ] Beta testers validate shelter quality

---

# 🔷 PHASE 3: Offline & Sync
## Duration: 3 weeks

### Objectives
- Implement offline-first architecture with ElectricSQL
- Enable map region downloads for offline use
- Cache shelters by region
- Smart sync when connectivity restored
- Show data freshness indicators

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-3.1 | As a user, I want to download my region's map for offline use | P0 | 8 |
| US-3.2 | As a user, I want shelters available without internet | P0 | 5 |
| US-3.3 | As a user, I want my data to sync automatically when back online | P0 | 3 |
| US-3.4 | As a user, I want to see when data was last updated | P1 | 2 |
| US-3.5 | As a user, I want to manage downloaded regions (delete, update) | P1 | 3 |
| US-3.6 | As a user, I want the app to suggest downloading regions based on my locations | P2 | 2 |

### Features Specification

#### F3.1 - ElectricSQL Integration

**Sync Shapes Configuration:**

1. **User Data Shape**
   - Tables: user_locations, user_favorites, user_settings
   - Filter: Where user_id = current user
   - Sync: Bidirectional, real-time

2. **Shelters Shape**
   - Tables: shelters
   - Filter: Where region_id IN (downloaded_regions)
   - Sync: Server → Client, on-demand

3. **Alerts Shape**
   - Tables: weather_alerts
   - Filter: Where region_id IN (user_regions) AND expires_at > now()
   - Sync: Server → Client, real-time
   - TTL: Delete expired alerts locally

**Local Database:**
- SQLite via ElectricSQL
- Same schema as server (via Drizzle)
- Automatic conflict resolution (last-write-wins)

#### F3.2 - Offline Map Regions

**Using Mapbox Offline Manager:**

**Predefined Regions:**
| Region | Bounds | Est. Size |
|--------|--------|-----------|
| Córdoba, AR | [-64.5, -31.8] to [-64.0, -31.2] | ~45 MB |
| Buenos Aires, AR | [-58.8, -35.0] to [-58.0, -34.4] | ~120 MB |
| CDMX, MX | [-99.4, 19.2] to [-98.9, 19.6] | ~100 MB |
| Santiago, CL | [-70.8, -33.6] to [-70.4, -33.3] | ~80 MB |

**Download Specifications:**
- Zoom levels: 8-16
- Style: Dark mode (default)
- Tiles + POIs included
- Background download support
- Progress tracking (0-100%)
- Pause/resume capability

**Storage Management:**
- Show total space used
- Show space per region
- Warning at 80% device storage
- Delete individual regions

#### F3.3 - Offline Shelter Queries

**Requirements:**
- Query shelters from local SQLite
- Haversine distance calculation in SQL
- No network dependency for shelter search
- Same UI as online mode

**Data Freshness:**
- Show "Last updated: X hours ago"
- Prompt to update if > 7 days old
- Auto-update on WiFi (configurable)

#### F3.4 - Sync Strategy

**Online → Offline:**
- Pre-download regions user frequents
- Sync shelters for downloaded regions
- Cache last known alerts
- Queue user actions for sync

**Offline → Online:**
- Sync queued favorites
- Sync queued ratings
- Fetch fresh alerts immediately
- Update stale shelter data

**Conflict Resolution:**
- User data: Client wins (most recent)
- Shelter data: Server wins (authoritative)
- Alerts: Server wins (real-time critical)

### UI Wireframes - Phase 3

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  OFFLINE MAPS               │    │  DOWNLOADING                │
├─────────────────────────────┤    ├─────────────────────────────┤
│  ←  Mapas Offline           │    │  ←  Mapas Offline           │
│                             │    │                             │
│  Almacenamiento             │    │  Descargando...             │
│  ████████████░░░░  165 MB   │    │                             │
│  de 500 MB disponibles      │    │  ┌─────────────────────┐    │
│                             │    │  │ Córdoba, Argentina  │    │
│  ─────────────────────────  │    │  │ ████████████░░░  78%│    │
│                             │    │  │ 35 MB de 45 MB      │    │
│  Descargados                │    │  │                     │    │
│  ┌─────────────────────┐    │    │  │ [Cancelar]          │    │
│  │ ✅ Córdoba          │    │    │  └─────────────────────┘    │
│  │ 45 MB               │    │    │                             │
│  │ Actualizado hace 2h │    │    │  ⚠️ Recomendamos WiFi      │
│  │ [Actualizar][Borrar]│    │    │  para descargas grandes    │
│  └─────────────────────┘    │    │                             │
│                             │    │                             │
│  Disponibles                │    │                             │
│  ┌─────────────────────┐    │    │                             │
│  │ Buenos Aires        │    │    │                             │
│  │ ~120 MB             │    │    │                             │
│  │ [Descargar]         │    │    │                             │
│  └─────────────────────┘    │    │                             │
│  ┌─────────────────────┐    │    │                             │
│  │ Mendoza             │    │    │                             │
│  │ ~35 MB              │    │    │                             │
│  │ [Descargar]         │    │    │                             │
│  └─────────────────────┘    │    │                             │
│                             │    │                             │
└─────────────────────────────┘    └─────────────────────────────┘
```

### Acceptance Criteria - Phase 3

| ID | Criteria | Priority |
|----|----------|----------|
| P3-AC1 | ElectricSQL initializes on app start | P0 |
| P3-AC2 | User data syncs bidirectionally | P0 |
| P3-AC3 | Shelters query works offline | P0 |
| P3-AC4 | Map displays downloaded regions offline | P0 |
| P3-AC5 | Download progress shows correctly | P0 |
| P3-AC6 | Delete region frees storage | P1 |
| P3-AC7 | Sync happens automatically when online | P0 |
| P3-AC8 | "Last updated" timestamp displays | P1 |
| P3-AC9 | App is fully usable in airplane mode | P0 |
| P3-AC10 | Background download completes | P1 |

### Definition of Done - Phase 3

- [ ] All P0 acceptance criteria pass
- [ ] ElectricSQL sync tested with poor connectivity
- [ ] Offline mode tested for 24+ hours
- [ ] Storage management tested near device limits
- [ ] Sync conflicts tested and resolved correctly
- [ ] Battery usage acceptable in offline mode

---

# 🔷 PHASE 4: ML & Intelligence
## Duration: 3 weeks

### Objectives
- Implement on-device ML for risk assessment
- Smart shelter ranking considering storm direction
- Route weather analysis
- Adaptive background monitoring for battery efficiency

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-4.1 | As a user, I want shelters ranked by strategic value, not just distance | P0 | 8 |
| US-4.2 | As a user, I want to understand why a shelter is recommended | P1 | 3 |
| US-4.3 | As a user, I want alerts for weather on my planned route | P1 | 8 |
| US-4.4 | As a user, I want the app to use minimal battery while monitoring | P0 | 5 |
| US-4.5 | As a user, I want to see a risk score for my current situation | P1 | 5 |

### Features Specification

#### F4.1 - Risk Assessment Model

**Model Type:** TensorFlow Lite classifier (~2-3 MB)

**Input Features (12):**
| Feature | Range | Description |
|---------|-------|-------------|
| weather_severity | 0-1 | Current alert severity |
| hail_probability | 0-1 | Probability of hail |
| hail_size_normalized | 0-1 | Expected hail size (0-4 inches) |
| wind_speed_normalized | 0-1 | Wind speed (0-100 mph) |
| storm_distance_normalized | 0-1 | Distance to storm (0-50 km) |
| storm_bearing | 0-1 | Direction of storm (0-360°) |
| time_to_impact_normalized | 0-1 | Minutes until impact (0-60) |
| user_speed_normalized | 0-1 | User speed (0-120 km/h) |
| shelter_distance_normalized | 0-1 | Nearest shelter (0-10 km) |
| shelter_eta_normalized | 0-1 | ETA to shelter (0-30 min) |
| is_driving | 0/1 | User is driving |
| time_of_day_normalized | 0-1 | Hour of day (0-23) |

**Output:**
| Output | Values |
|--------|--------|
| risk_score | 0-100 |
| recommended_action | continue, monitor, seek_shelter, shelter_now |
| urgency_level | 1-5 |

**Performance Targets:**
- Model load time: < 500ms
- Inference time: < 50ms
- Memory usage: < 50MB
- Battery impact: Negligible

#### F4.2 - Smart Shelter Ranking

**Ranking Factors:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Distance | 30% | Closer is better |
| ETA vs Storm ETA | 25% | Can reach before storm? |
| Direction from Storm | 25% | Away from storm is better |
| Coverage Quality | 15% | Full coverage preferred |
| User Preference | 5% | Favorites get boost |

**Ranking Algorithm:**
1. Calculate base score for each shelter
2. Apply storm direction modifier:
   - Shelters in opposite direction of storm: +20%
   - Shelters in storm path: -30%
3. Apply reachability modifier:
   - Reachable before storm: +25%
   - Not reachable: Deprioritize but don't hide
4. Sort by final score
5. Generate explanation for top recommendation

**Explanation Examples:**
- "Recomendado: Cerca (800m), alcanzable antes de la tormenta, fuera del camino de la tormenta"
- "Más seguro: Dirección opuesta a la tormenta, techado completo"

#### F4.3 - Route Weather Analysis

**Input:**
- Origin coordinates
- Destination coordinates
- Departure time

**Process:**
1. Get route from Mapbox Directions API
2. Sample points along route (every 10km or 10 min)
3. Fetch weather forecast for each point at estimated arrival time
4. Identify high-risk segments
5. Generate warnings and recommendations

**Output:**
| Field | Description |
|-------|-------------|
| overall_risk | low, medium, high, extreme |
| segments[] | Array of route segments with risk levels |
| warnings[] | Specific warnings for high-risk segments |
| recommendations[] | Actionable recommendations |
| alternative_departure | Suggested departure time to avoid weather |

#### F4.4 - Adaptive Background Monitoring

**Threat Levels:**
| Level | Location Accuracy | Update Interval | Battery Impact |
|-------|-------------------|-----------------|----------------|
| none | Low | 15 min | Minimal |
| watch | Balanced | 5 min | Low |
| warning | High | 1 min | Medium |
| emergency | Best | 10 sec | High |

**Automatic Transitions:**
- No alerts nearby → `none`
- Alert within 50km → `watch`
- Alert within 10km → `warning`
- Alert affecting current location → `emergency`

**Battery Optimization:**
- Use significant location changes when possible
- Batch network requests
- Defer non-critical sync
- Pause monitoring when stationary for > 1 hour

### UI Wireframes - Phase 4

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  RISK ASSESSMENT            │    │  ROUTE ANALYSIS             │
├─────────────────────────────┤    ├─────────────────────────────┤
│  ←  Tu Situación            │    │  ←  Análisis de Ruta        │
│                             │    │                             │
│  ┌─────────────────────┐    │    │  Córdoba → Buenos Aires     │
│  │    RIESGO: 72       │    │    │  Salida: Hoy 14:00          │
│  │    ████████████░░░  │    │    │                             │
│  │       ALTO          │    │    │  Riesgo General: 🟡 MEDIO   │
│  └─────────────────────┘    │    │                             │
│                             │    │  ┌───────────────────┐      │
│  Recomendación:             │    │  │ MAPA CON RUTA     │      │
│  ┌─────────────────────┐    │    │  │ Segmentos coloreados│     │
│  │ 🛡️ BUSCA REFUGIO    │    │    │  │ por riesgo        │      │
│  │ Tormenta llegando   │    │    │  └───────────────────┘      │
│  │ en ~12 minutos      │    │    │                             │
│  └─────────────────────┘    │    │  Segmentos:                 │
│                             │    │  🟢 0-120km: Sin riesgo     │
│  Factores:                  │    │  🟡 120-180km: Lluvia       │
│  • Granizo detectado        │    │  🔴 180-220km: Tormenta     │
│  • 8km de distancia         │    │  🟢 220-650km: Sin riesgo   │
│  • Refugio a 3 min          │    │                             │
│                             │    │  ⚠️ Recomendación:          │
│  Mejor Refugio:             │    │  Salir 2 horas más tarde    │
│  ┌─────────────────────┐    │    │  evitaría la tormenta       │
│  │ ⛽ Shell Centro      │    │    │                             │
│  │ 800m • Techado      │    │    │  [Ver alternativas]         │
│  │ Opuesto a tormenta  │    │    │                             │
│  │ [  NAVEGAR →  ]     │    │    │                             │
│  └─────────────────────┘    │    │                             │
└─────────────────────────────┘    └─────────────────────────────┘
```

### Acceptance Criteria - Phase 4

| ID | Criteria | Priority |
|----|----------|----------|
| P4-AC1 | ML model loads in < 500ms | P0 |
| P4-AC2 | Risk score updates in real-time | P0 |
| P4-AC3 | Shelter ranking considers storm direction | P0 |
| P4-AC4 | Explanation shown for top shelter | P1 |
| P4-AC5 | Route analysis shows segment risks | P1 |
| P4-AC6 | Background monitoring adapts to threat level | P0 |
| P4-AC7 | Battery usage < 5% per hour in "none" mode | P0 |
| P4-AC8 | Battery usage < 15% per hour in "warning" mode | P0 |

### Definition of Done - Phase 4

- [ ] ML model trained and validated (>85% accuracy)
- [ ] Model size < 5MB
- [ ] Inference benchmarked on low-end devices
- [ ] Shelter ranking A/B tested with users
- [ ] Route analysis tested with real trip data
- [ ] Battery usage profiled and optimized
- [ ] Background monitoring tested over 24 hours

---

# 🔷 PHASE 5: Premium & Monetization
## Duration: 2 weeks

### Objectives
- Implement freemium subscription model
- Create paywalls for premium features
- Integrate Stripe for web payments
- Integrate In-App Purchases for mobile
- Track conversion and revenue metrics

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-5.1 | As a user, I want to understand what premium offers | P0 | 2 |
| US-5.2 | As a user, I want to pay easily via my preferred method | P0 | 8 |
| US-5.3 | As a user, I want to manage my subscription | P1 | 3 |
| US-5.4 | As a user, I want a free trial before committing | P1 | 3 |
| US-5.5 | As a free user, I accept minimal ads in exchange for free access | P1 | 5 |

### Subscription Tiers

| Feature | Free | Premium |
|---------|:----:|:-------:|
| **Precio** | $0 | $2.99/mes o $24.99/año |
| Active alerts | ✅ | ✅ |
| Map with radar | ✅ | ✅ |
| Nearby shelters | 5 max | ✅ Unlimited |
| Saved locations | 1 | 10 |
| Offline maps | ❌ | ✅ |
| AI risk assessment | ❌ | ✅ |
| Route analysis | ❌ | ✅ |
| Smart shelter ranking | Basic | ✅ Full |
| CarPlay/Android Auto | ❌ | ✅ |
| Critical alerts (iOS) | ❌ | ✅ |
| Ad-free | ❌ | ✅ |
| Priority support | ❌ | ✅ |

### Features Specification

#### F5.1 - Paywall System

**Trigger Points:**
- Attempting to download offline maps
- Viewing more than 5 shelters
- Trying to save 2nd location
- Accessing route analysis
- Enabling CarPlay

**Paywall Content:**
- Feature-specific headline
- Value proposition (3-4 bullet points)
- All premium features list
- Pricing options (monthly/yearly)
- Free trial CTA (7 days)
- "Restore Purchases" link

**Paywall Variants (A/B Testing):**
- A: Feature focus (what you're missing)
- B: Savings focus (yearly vs monthly)
- C: Social proof (user testimonials)

#### F5.2 - Payment Integration

**Web Payments (Stripe):**
- Checkout session via API
- Hosted checkout page
- Webhook for subscription events
- Customer portal for management

**In-App Purchases:**
- iOS: StoreKit 2
- Android: Google Play Billing
- Product IDs:
  - `advia_premium_monthly`
  - `advia_premium_yearly`
- Receipt validation on backend

**Pricing Strategy:**
| Channel | Monthly | Yearly | Savings |
|---------|---------|--------|---------|
| Web (Stripe) | $2.69 | $23.99 | 10% vs IAP |
| iOS (IAP) | $2.99 | $24.99 | - |
| Android (IAP) | $2.99 | $24.99 | - |

*Web pricing lower to offset lower commission (3% vs 15%)*

#### F5.3 - Feature Gating

**Implementation:**
- Check subscription status before premium features
- Show paywall for non-subscribers
- Graceful degradation (show limited version when possible)
- Cache subscription status locally
- Verify subscription on app launch

**Premium Features Checks:**
- Offline maps: Check before download
- Shelter list: Show max 5, blur remaining
- Locations: Check before saving 2nd
- Route analysis: Check before opening screen
- Risk assessment: Show basic score, paywall for details

#### F5.4 - Advertising (Free Tier)

**Ad Placements:**
- Banner ad on home screen (bottom)
- Interstitial after viewing 5 shelter details
- Native ad in shelter list (every 10 items)

**Ad Rules:**
- No ads during active severe weather alert
- Max 1 interstitial per 5 minutes
- No video ads (disruptive for urgent use case)
- AdMob as primary network

### API Endpoints - Phase 5

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/subscriptions/checkout` | POST | Create Stripe checkout session |
| `POST /api/subscriptions/webhook` | POST | Handle Stripe webhooks |
| `GET /api/subscriptions/status` | GET | Get current subscription status |
| `POST /api/subscriptions/verify-receipt` | POST | Verify IAP receipt |
| `POST /api/subscriptions/restore` | POST | Restore purchases |

### UI Wireframes - Phase 5

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  PAYWALL                    │    │  SUBSCRIPTION MANAGEMENT    │
├─────────────────────────────┤    ├─────────────────────────────┤
│              ✕              │    │  ←  Tu Suscripción          │
│                             │    │                             │
│  🛡️ Desbloquea Todo         │    │  Plan Actual                │
│                             │    │  ┌─────────────────────┐    │
│  Funcionalidad bloqueada:   │    │  │ ⭐ ADVIA PREMIUM    │    │
│  "Mapas Offline"            │    │  │ $2.99/mes           │    │
│                             │    │  │ Renueva: 15 Feb     │    │
│  Con Premium obtienes:      │    │  └─────────────────────┘    │
│                             │    │                             │
│  ✅ Mapas sin conexión      │    │  Beneficios incluidos:      │
│  ✅ Refugios ilimitados     │    │  ✅ Mapas offline           │
│  ✅ Análisis de ruta IA     │    │  ✅ Refugios ilimitados     │
│  ✅ CarPlay / Android Auto  │    │  ✅ 10 ubicaciones          │
│  ✅ Sin publicidad          │    │  ✅ Análisis de ruta        │
│                             │    │  ✅ Sin publicidad          │
│  ┌─────────────────────┐    │    │                             │
│  │ PRUEBA 7 DÍAS GRATIS│    │    │  ─────────────────────────  │
│  │ Luego $2.99/mes     │    │    │                             │
│  └─────────────────────┘    │    │  [Cambiar a plan anual]     │
│                             │    │  Ahorra 30% - $24.99/año    │
│  ┌─────────────────────┐    │    │                             │
│  │ Plan Anual $24.99   │    │    │  [Cancelar suscripción]     │
│  │ Ahorra 30%          │    │    │                             │
│  └─────────────────────┘    │    │  ─────────────────────────  │
│                             │    │                             │
│  Restaurar compras          │    │  Pagado vía: App Store      │
│  Términos • Privacidad      │    │  [Gestionar en App Store]   │
└─────────────────────────────┘    └─────────────────────────────┘
```

### Acceptance Criteria - Phase 5

| ID | Criteria | Priority |
|----|----------|----------|
| P5-AC1 | Paywall displays for premium features | P0 |
| P5-AC2 | IAP purchase flow completes (iOS) | P0 |
| P5-AC3 | IAP purchase flow completes (Android) | P0 |
| P5-AC4 | Web checkout works via Stripe | P0 |
| P5-AC5 | Subscription status syncs across devices | P0 |
| P5-AC6 | Premium features unlock after purchase | P0 |
| P5-AC7 | Free trial starts and converts correctly | P1 |
| P5-AC8 | Restore purchases works | P0 |
| P5-AC9 | Subscription expires correctly | P0 |
| P5-AC10 | Ads show for free users | P1 |
| P5-AC11 | Ads hidden for premium users | P0 |
| P5-AC12 | Analytics track conversion funnel | P1 |

### Definition of Done - Phase 5

- [ ] All payment flows tested in sandbox
- [ ] Receipt validation secure and working
- [ ] Subscription status cached and verified
- [ ] A/B test framework ready
- [ ] Revenue tracking in analytics
- [ ] Legal compliance (terms, privacy, refund policy)

---

# 🔷 PHASE 6: CarPlay & Advanced
## Duration: 3 weeks

### Objectives
- Implement CarPlay support for iOS
- Implement Android Auto support
- Critical alerts that bypass Do Not Disturb
- Voice announcements for alerts
- Background driving detection

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-6.1 | As a driver, I want alerts on my car's screen | P0 | 8 |
| US-6.2 | As a driver, I want voice announcements | P0 | 5 |
| US-6.3 | As a user, I want critical alerts in Do Not Disturb | P0 | 5 |
| US-6.4 | As a driver, I want navigation to shelter from CarPlay | P1 | 5 |
| US-6.5 | As a user, I want the app to detect when I'm driving | P1 | 3 |

### Features Specification

#### F6.1 - CarPlay Integration

**Supported Templates:**
- List Template (main screen)
- Alert Template (weather warnings)
- Point of Interest Template (shelters)
- Navigation Template (routing) *Future*

**Main Screen (List Template):**
- Section 1: Current Conditions
  - Risk level indicator
  - Active alerts count
- Section 2: Nearby Shelters (top 5)
  - Name, distance, ETA
  - Tap to navigate

**Alert Handling:**
- Show alert template for severe/extreme weather
- Include voice announcement
- Actions: "Find Shelter", "Dismiss"

#### F6.2 - Android Auto Integration

**Supported Features:**
- App launcher icon
- Notification cards
- Voice commands (limited)

**Notification Templates:**
- Weather alert notification
- Tap action: Open shelter list
- Voice readout of alert

#### F6.3 - Critical Alerts (iOS)

**Requirements:**
- Apple Developer entitlement request
- Explain use case (weather emergency)
- Expected approval time: 2-4 weeks

**Implementation:**
- Entitlement: `com.apple.developer.usernotifications.critical-alerts`
- Sound plays at full volume
- Bypasses mute and Do Not Disturb
- Visual indicator on notification

**Trigger Conditions:**
- Tornado warning affecting user
- Severe hail warning (> 2 inch)
- Extreme alert with < 15 min ETA

#### F6.4 - Voice Announcements

**Using Text-to-Speech:**
- Platform TTS (iOS/Android native)
- Language: Match app language
- Rate: Slightly slow for clarity

**Announcement Triggers:**
- New severe/extreme alert
- Risk level increases to high/extreme
- Navigation instruction (when routing to shelter)

**Announcement Script:**
- "Weather alert: [Type] warning for your area. [Instructions]. Tap to find shelter."

#### F6.5 - Driving Detection

**Detection Methods:**
- Speed > 15 km/h for > 30 seconds
- Activity Recognition API (iOS/Android)
- Connected to CarPlay/Android Auto

**Behavior When Driving:**
- Automatically show shelter-focused UI
- Increase monitoring frequency
- Enable voice announcements
- Disable detailed interactions (safety)

### Acceptance Criteria - Phase 6

| ID | Criteria | Priority |
|----|----------|----------|
| P6-AC1 | CarPlay main screen displays | P0 |
| P6-AC2 | CarPlay shows nearby shelters | P0 |
| P6-AC3 | CarPlay alert template works | P0 |
| P6-AC4 | Voice announcement plays | P0 |
| P6-AC5 | Android Auto notification shows | P0 |
| P6-AC6 | Critical alert sounds in DND | P0 |
| P6-AC7 | Navigation to shelter works from CarPlay | P1 |
| P6-AC8 | Driving detection triggers correctly | P1 |

### Definition of Done - Phase 6

- [ ] CarPlay tested on real device
- [ ] Android Auto tested on real device
- [ ] Apple Critical Alerts entitlement approved
- [ ] Voice TTS quality validated
- [ ] Driving detection accuracy > 90%
- [ ] Safety guidelines compliance (no complex interactions while driving)

---

# 🔷 PHASE 7: B2B Dashboard
## Duration: 4 weeks

### Objectives
- Create Next.js web dashboard for fleet managers
- Real-time fleet tracking on map
- Alert management for multiple vehicles
- Reporting and analytics
- API access for integrations

### User Stories

| ID | Story | Priority | Points |
|----|-------|----------|--------|
| US-7.1 | As a fleet manager, I want to see all vehicles on a map | P0 | 8 |
| US-7.2 | As a fleet manager, I want alerts when vehicles are in danger | P0 | 5 |
| US-7.3 | As a fleet manager, I want to message drivers directly | P1 | 5 |
| US-7.4 | As a fleet manager, I want incident reports | P0 | 5 |
| US-7.5 | As an admin, I want to manage vehicles and drivers | P0 | 3 |
| US-7.6 | As a developer, I want API access for integrations | P1 | 5 |

### Features Specification

#### F7.1 - Dashboard Application

**Tech Stack:**
- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- Mapbox GL JS
- TanStack Query
- Better-Auth (same as mobile)

**Pages:**
| Route | Purpose |
|-------|---------|
| `/` | Redirect to dashboard |
| `/login` | Company admin login |
| `/dashboard` | Main map + overview |
| `/dashboard/vehicles` | Vehicle list + management |
| `/dashboard/drivers` | Driver list + management |
| `/dashboard/alerts` | Alert history + settings |
| `/dashboard/reports` | Analytics + exports |
| `/dashboard/settings` | Company settings, billing |
| `/dashboard/api` | API keys + docs |

#### F7.2 - Fleet Map

**Features:**
- Real-time vehicle positions
- Weather alert overlay
- Vehicle status indicators (safe/warning/danger)
- Cluster markers for large fleets
- Click vehicle for details

**Real-time Updates:**
- WebSocket or SSE for position updates
- Supabase Realtime alternative via separate WS server
- Update interval: 30 seconds
- Battery status from mobile app

#### F7.3 - Alert Management

**Fleet Alerts:**
- Monitor all vehicles against active weather alerts
- Calculate affected vehicles automatically
- One-click notify all affected drivers
- Track acknowledgment status

**Notification Options:**
- Push notification to driver's app
- SMS to driver's phone
- Email to driver
- Dashboard notification to fleet manager

#### F7.4 - Reporting

**Built-in Reports:**
| Report | Description |
|--------|-------------|
| Incident History | All alerts affecting fleet, by date |
| Response Time | Time from alert to driver shelter |
| Damage Avoided | Estimated savings from alerts |
| Vehicle Activity | Miles driven, alerts received |
| Monthly Summary | Overview of all metrics |

**Export Options:**
- CSV download
- PDF report (formatted)
- API endpoint for integrations

#### F7.5 - API Access

**API Features:**
- REST API for alerts, vehicles, drivers
- Webhook subscriptions for real-time events
- API key authentication
- Rate limiting (by plan tier)

**Webhook Events:**
| Event | Trigger |
|-------|---------|
| `alert.created` | New alert affects fleet |
| `vehicle.alert` | Specific vehicle in danger |
| `driver.sheltered` | Driver reached shelter |
| `alert.expired` | Alert no longer active |

### B2B Pricing

| Plan | Vehicles | Price/Month | Features |
|------|----------|-------------|----------|
| Starter | 1-50 | $199 | Basic dashboard, email alerts |
| Business | 51-200 | $599 | + API access, SMS, 5 admins |
| Enterprise | 201-500 | $1,299 | + Custom integrations, SLA, dedicated support |
| Custom | 500+ | Contact | Volume pricing |

### Database Schema (B2B)

**Additional Tables:**

| Table | Purpose |
|-------|---------|
| `companies` | Company accounts |
| `company_admins` | Admin users linked to companies |
| `vehicles` | Company vehicles |
| `drivers` | Drivers linked to vehicles |
| `vehicle_alerts` | Alert instances affecting vehicles |
| `api_keys` | API keys for company access |
| `webhooks` | Webhook subscriptions |

### UI Wireframes - Phase 7

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADVIA FLEET DASHBOARD                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  🚛 ACME Transport        Dashboard | Vehículos | Alertas | Reportes    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────┐ │
│  │                                      │  │  ALERTAS ACTIVAS         │ │
│  │           MAPA DE FLOTA              │  │                          │ │
│  │                                      │  │  🔴 Granizo Severo       │ │
│  │    🚛      🚛                        │  │  Córdoba Centro          │ │
│  │         ⚠️ ZONA                      │  │  Vehículos afectados: 3  │ │
│  │    🚛   ALERTA   🚛                  │  │  [Notificar a todos]     │ │
│  │              🚛                      │  │                          │ │
│  │                                      │  │  ─────────────────────── │ │
│  │    🚛 = Seguro   ⚠️🚛 = En peligro   │  │                          │ │
│  │                                      │  │  🟡 Tormenta             │ │
│  └──────────────────────────────────────┘  │  Zona Industrial         │ │
│                                            │  Vehículos afectados: 1  │ │
│  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │                     RESUMEN DEL MES                              │  │ │
│  │                                                                  │  │ │
│  │   Alertas          Vehículos         Daños Evitados    Respuesta│  │ │
│  │   Recibidas        Protegidos        (estimado)        Promedio │  │ │
│  │      47               23              ~$12,500          4.2 min │  │ │
│  │                                                                  │  │ │
│  └──────────────────────────────────────────────────────────────────┘  │ │
│                                            │                          │ │
│                                            └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria - Phase 7

| ID | Criteria | Priority |
|----|----------|----------|
| P7-AC1 | Dashboard login works for company admins | P0 |
| P7-AC2 | Map displays all company vehicles | P0 |
| P7-AC3 | Vehicle positions update in real-time | P0 |
| P7-AC4 | Alert notification sent to dashboard | P0 |
| P7-AC5 | Fleet manager can notify affected drivers | P0 |
| P7-AC6 | Reports show incident history | P0 |
| P7-AC7 | CSV export works | P1 |
| P7-AC8 | API endpoints documented and working | P1 |
| P7-AC9 | Webhooks deliver events | P1 |
| P7-AC10 | Billing page shows subscription | P1 |

### Definition of Done - Phase 7

- [ ] Dashboard deployed and accessible
- [ ] Real-time updates tested with 100+ vehicles (simulated)
- [ ] API documentation published
- [ ] Webhook delivery tested
- [ ] First pilot customer onboarded
- [ ] Support documentation complete

---

# 📊 Testing Strategy

## Test Pyramid

```
         ┌─────────┐
         │   E2E   │  10%  - Critical user flows
         ├─────────┤
         │  Integ  │  20%  - API + sync integration
         ├─────────┤
         │  Unit   │  70%  - Business logic, utilities
         └─────────┘
```

## Testing by Package

| Package | Test Types | Tools |
|---------|------------|-------|
| `packages/db` | Unit (schema validation) | Vitest |
| `packages/api` | Unit + Integration | Vitest + Supertest |
| `packages/auth` | Integration | Vitest |
| `packages/electric` | Integration | Vitest |
| `apps/mobile` | Unit + E2E | Jest + Detox |
| `apps/web` | Unit + E2E | Vitest + Playwright |
| `apps/dashboard` | Unit + E2E | Vitest + Playwright |

## Critical Test Scenarios

### Authentication
- [ ] User can register with email
- [ ] User can login with email
- [ ] User can login with Google
- [ ] Session persists across app restart
- [ ] Logout clears session

### Weather Alerts
- [ ] Alerts fetch from API correctly
- [ ] Alerts filter by user location
- [ ] Push notification sent for severe alert
- [ ] Alert detail displays correctly

### Shelters
- [ ] Shelters display on map
- [ ] Distance calculation is accurate
- [ ] ETA calculation works
- [ ] Navigation opens external app

### Offline
- [ ] App functions without network
- [ ] Shelters queryable offline
- [ ] Map displays downloaded region
- [ ] Sync resumes when online

### Payments
- [ ] IAP purchase completes
- [ ] Web checkout works
- [ ] Subscription status updates
- [ ] Premium features unlock

---

# 🚀 Launch Checklist

## Pre-Launch (1 week before)

- [ ] All P0 acceptance criteria met
- [ ] App Store assets prepared
  - [ ] App icon (1024x1024)
  - [ ] Screenshots (6.5", 5.5" iPhone, iPad)
  - [ ] App preview video (optional)
  - [ ] Description in Spanish and English
  - [ ] Keywords optimized
- [ ] Play Store assets prepared
  - [ ] Feature graphic (1024x500)
  - [ ] Screenshots (phone, tablet)
  - [ ] Description localized
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Analytics configured
- [ ] Error tracking active
- [ ] Beta testing complete (50+ users)
- [ ] Performance benchmarks met

## Launch Day

- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Deploy web landing page
- [ ] Social media announcements ready
- [ ] Press kit prepared
- [ ] Monitor crash rates
- [ ] Monitor API performance
- [ ] Support channels active

## Post-Launch (Week 1)

- [ ] Monitor and respond to reviews
- [ ] Track key metrics (DAU, retention, conversion)
- [ ] Prioritize bug fixes
- [ ] Collect user feedback
- [ ] Celebrate 🎉

---

# 📎 Appendices

## A. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...@neon.tech/advia

# ElectricSQL
ELECTRIC_URL=https://...
ELECTRIC_TOKEN=...

# Auth
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...

# Maps
MAPBOX_ACCESS_TOKEN=pk....
MAPBOX_SECRET_TOKEN=sk....

# Weather APIs
OPENWEATHERMAP_API_KEY=...
TOMORROW_IO_API_KEY=...

# Payments
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
MIXPANEL_TOKEN=...
SENTRY_DSN=...

# Push Notifications
EXPO_PUSH_TOKEN=...
```

## B. Useful Commands

```bash
# Development
turbo dev                    # Start all apps
turbo dev --filter=mobile    # Start mobile only
turbo dev --filter=web       # Start web only

# Database
turbo db:push               # Push schema to Neon
turbo db:generate           # Generate migrations
turbo db:migrate            # Run migrations
turbo db:studio             # Open Drizzle Studio

# Building
turbo build                 # Build all
eas build --platform ios    # Build iOS
eas build --platform android # Build Android

# Testing
turbo test                  # Run all tests
turbo test:e2e              # Run E2E tests

# Linting
turbo lint                  # Lint all
turbo typecheck             # Type check all
```

## C. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `turborepo` | ^2.0 | Monorepo build system |
| `next` | ^15.0 | Web framework |
| `expo` | ^53.0 | Mobile framework |
| `drizzle-orm` | ^0.35 | Database ORM |
| `@electric-sql/client` | ^0.12 | Offline sync |
| `better-auth` | ^1.0 | Authentication |
| `@tanstack/react-query` | ^5.0 | Data fetching |
| `@rnmapbox/maps` | ^10.0 | Maps (mobile) |
| `mapbox-gl` | ^3.0 | Maps (web) |
| `stripe` | ^17.0 | Payments |

## D. Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [ElectricSQL](https://electric-sql.com/docs)
- [Better-Auth](https://better-auth.com)
- [TanStack Query](https://tanstack.com/query)
- [NeonTech](https://neon.tech/docs)
- [Mapbox](https://docs.mapbox.com)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** After Phase 1 completion
