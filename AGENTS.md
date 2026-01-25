# AGENT.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Driwet is an AI-powered storm alert and shelter finder app for drivers. It provides real-time severe weather alerts (particularly hail), recommends nearby shelters, and guides users to safety. Target market: Argentina/LATAM regions with frequent hail storms.

## Monorepo Structure

Turborepo + pnpm workspaces with three apps and five shared packages:

**Apps:**
- `apps/mobile` - Expo 54 / React Native 0.81 app (iOS & Android)
- `apps/platform` - Next.js 16 dashboard (port 3001)
- `apps/landing` - Next.js 16 marketing site (port 3000)

**Packages:**
- `packages/api` - oRPC API routers (user, locations, alerts, chat, weather, routes, places, subscription)
- `packages/auth` - Better Auth config with Drizzle adapter
- `packages/db` - Drizzle ORM schemas for Neon PostgreSQL
- `packages/env` - T3-style environment validation with Zod
- `packages/i18n` - i18next internationalization

## Commands

```bash
# Development
pnpm dev              # All apps in parallel
pnpm dev:mobile       # Mobile only (Expo)
pnpm dev:platform     # Platform only (port 3001)
pnpm dev:landing      # Landing only (port 3000)

# Database (Neon PostgreSQL + Drizzle)
pnpm db:push          # Push schema changes
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Quality
pnpm check            # Biome format + lint (auto-fix)
pnpm check-types      # TypeScript type check
pnpm build            # Build all packages/apps
```

**Mobile-specific (from `apps/mobile`):**
```bash
pnpm dev              # Start Metro with --clear
pnpm ios              # Build and run iOS
pnpm android          # Build and run Android
pnpm prebuild         # Generate native code
```

## Architecture

### API Layer (oRPC)
- API routes at `/api/rpc/[[...rest]]` in platform app
- Routers in `packages/api/src/routers/`
- Use `publicProcedure` for unauthenticated, `protectedProcedure` for authenticated endpoints
- Context includes session from Better Auth

### Database Schema
Tables in `packages/db/src/schema/`:
- Auth tables: users, sessions, accounts, verifications, organizations, members, teams
- App tables: weather_cache, alert_history, user_locations, fleets, push_tokens, chat_sessions, routes

### Authentication
Better Auth with:
- Providers: email/password, Google OAuth, Apple OAuth
- Plugins: organizations, expo (mobile)
- 30-day sessions with daily refresh

### External APIs
- **Tomorrow.io** - Primary weather data and alerts
- **OpenWeather** - Fallback weather
- **Mapbox** - Maps (RNMapbox) and places search
- **RevenueCat** - Mobile subscriptions
- **PostHog** - Analytics
- **Resend** - Transactional email

## Code Style

- Biome with tabs, double quotes
- Tailwind class sorting via `useSortedClasses` (works with `cn`, `clsx`, `cva`)
- TypeScript strict mode
- No unused variables/imports enforced

## Mobile Development

- Expo Router for file-based navigation in `apps/mobile/app/`
- HeroUI Native components + Tailwind (uniwind)
- Mapbox requires `MAPBOX_DOWNLOAD_TOKEN` secret for EAS builds
- RevenueCat for subscriptions (react-native-purchases)
- Zustand for local state, TanStack Query for server state

## Adding Features

1. **Schema change**: Edit `packages/db/src/schema/` → `pnpm db:generate` → `pnpm db:push`
2. **API endpoint**: Add to existing router or create new one in `packages/api/src/routers/`
3. **Frontend**: Consume via oRPC client with TanStack Query integration

## Environment Variables

Server needs: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TOMORROW_IO_API_KEY`
Mobile needs: `EXPO_PUBLIC_SERVER_URL`, `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
