# Gowai B2B Fleet Expansion Design

**Fecha:** 2025-01-21
**Status:** Roadmap (post-validación B2C)
**Autor:** Brainstorming session

---

## Resumen Ejecutivo

Expansión de Gowai hacia el mercado B2B con dos verticales:
1. **Flotas de delivery/logistics** — Dashboard web para fleet managers
2. **Aseguradoras** — API para integrar alertas en sus sistemas (Fase 2)

El B2B se activa después de validar el producto B2C con métricas sólidas.

---

## Contexto y Validación de Mercado

### Problema B2B

- Flotas de delivery tienen vehículos en la calle todo el día
- Un vehículo dañado = $300K-7M ARS en reparación + días sin operar
- Fleet managers no tienen visibilidad de riesgos climáticos en tiempo real
- Aseguradoras pagan $12.2M ARS promedio por destrucción total (2024/2025)

### Oportunidad de Mercado

- Fleet management software market: $5.23B para 2032 (18.7% CAGR)
- Weather intelligence para logistics es un gap en LATAM
- Competidores (Samsara, Tomorrow.io) cobran $30-40/vehículo — espacio para solución vertical más económica

### Fuentes

- [Fleet Management Software Market - MarketsandMarkets](https://www.prnewswire.com/news-releases/fleet-management-software-market-worth-5-23-billion-by-2032---exclusive-report-by-marketsandmarkets-302627881.html)
- [Tomorrow.io Weather Intelligence Platforms](https://www.tomorrow.io/blog/the-top-10-weather-intelligence-platforms-for-business-resilience-in-2025/)
- [Costos de granizo Argentina - Los Andes](https://www.losandes.com.ar/sociedad/cuanto-sale-reparar-el-auto-danado-por-granizo)
- [Latin America Fleet Insurance Market](https://www.openpr.com/news/3942351/latin-america-commercial-auto-fleet-insurance-market-outlook)

---

## Arquitectura

### Estructura del Monorepo

```
apps/
├── native/          # App móvil Expo (sin cambios)
├── platform/        # Dashboard B2B + portal consumer (renombrar de web)
└── landing/         # Landing page marketing (nuevo)

packages/
├── api/             # Agregar endpoints B2B
├── db/              # Agregar tablas B2B
└── ...
```

### Nuevas Tablas (packages/db)

```typescript
// organizations - Empresas cliente B2B
organizations: {
  id: uuid,
  name: string,
  plan: enum('starter', 'pro', 'business', 'enterprise'),
  billingEmail: string,
  createdAt: timestamp,
}

// org_members - Usuarios de la empresa
org_members: {
  id: uuid,
  organizationId: uuid -> organizations.id,
  userId: uuid -> users.id,
  role: enum('admin', 'viewer'),
  invitedAt: timestamp,
}

// vehicles - Vehículos de la flota
vehicles: {
  id: uuid,
  organizationId: uuid -> organizations.id,
  plate: string,
  assignedUserId: uuid -> users.id (nullable),
  status: enum('active', 'inactive'),
  createdAt: timestamp,
}

// fleet_alert_history - Historial de alertas de flota
fleet_alert_history: {
  id: uuid,
  organizationId: uuid -> organizations.id,
  alertType: string,
  severity: enum('low', 'medium', 'high', 'extreme'),
  vehiclesAffected: integer,
  managedAt: timestamp (nullable),
  createdAt: timestamp,
}
```

### Nuevos Endpoints ORPC (packages/api)

```typescript
// organizations/
organizations.create
organizations.update
organizations.delete
organizations.getMembers
organizations.inviteMember
organizations.removeMember
organizations.getBillingInfo

// fleet/
fleet.getVehicles
fleet.addVehicle
fleet.removeVehicle
fleet.getActiveAlerts
fleet.getVehiclesAtRisk
fleet.getAlertHistory

// fleet-notifications/
fleetNotifications.broadcastToVehicles
fleetNotifications.notifyManager
```

### Real-time

- **Tecnología:** Ably + Neon serverless
- **Canales:** Un canal por organización para alertas de flota
- **Flujo:** Background job detecta riesgo → publica en Ably → dashboard recibe via WebSocket

---

## Dashboard Fleet Manager

### Pantallas P0 (MVP)

#### 1. Vista Mapa en Tiempo Real (`/dashboard/map`)
- Mapa fullscreen con todos los vehículos (markers con estado)
- Capas de radar meteorológico y zonas de alerta
- Sidebar con lista filtrable: en riesgo / seguros / offline
- Click en vehículo → conductor, ubicación, ETA a refugio

#### 2. Centro de Alertas (`/dashboard/alerts`)
- Feed en tiempo real de alertas
- Cada alerta: vehículos afectados, severidad, tiempo de impacto
- Acciones: "Notificar a todos", "Ver en mapa", "Marcar gestionada"
- Historial con filtros

#### 3. Home/Overview (`/dashboard`)
- KPIs: vehículos activos, en riesgo, alertas hoy
- Mapa mini con hotspots
- Últimas alertas pendientes

### Pantallas P1 (Post-validación)

- **Reportes** (`/dashboard/reports`): ROI, eventos evitados, exportar PDF
- **Comunicación masiva** (`/dashboard/broadcast`): Push a conductores
- **Gestión de flota** (`/dashboard/vehicles`): CRUD vehículos

---

## Pricing B2B

### Tiers

| Plan | Precio | Vehículos | Funcionalidades |
|------|--------|-----------|-----------------|
| **Starter** | $99/mes | Hasta 25 | Mapa tiempo real, alertas, 1 admin |
| **Pro** | $249/mes | Hasta 100 | + historial 90 días, 3 admins, reportes básicos |
| **Business** | $499/mes | Hasta 300 | + comunicación masiva, reportes avanzados, 10 admins |
| **Enterprise** | Custom | Ilimitado | + API access, SLA, soporte dedicado |

### Vehículo Adicional

- Starter: $4/vehículo
- Pro: $3/vehículo
- Business: $2.50/vehículo
- Enterprise: Negociado

### Comparación de Mercado

- Samsara (suite completa): $30-40/vehículo/mes
- Gowai (vertical weather): $2.50-4/vehículo/mes
- **Posicionamiento:** 10x más económico por ser específico

---

## Go-to-Market (Cuando se active B2B)

### Fase 1: Primeros 3 Clientes

**Target:** Flotas de 50-200 vehículos en Argentina

**Verticales:**
- Delivery última milla
- Distribuidoras
- Logística regional

**Pitch:**
> "Un vehículo dañado por granizo te cuesta $2-7M ARS + días sin operar. Por $2.50/vehículo/mes, tu fleet manager recibe alertas 30 min antes y ve quién está en riesgo."

**Oferta Early Adopter:**
- 60 días gratis
- Onboarding personalizado
- Precio Starter locked 12 meses

### Fase 2: Partnerships

**Asociaciones Target:**
- FADEEAC
- Cámaras de comercio provinciales (Córdoba, Mendoza, Santa Fe)
- Eventos: ExpoLogística

**Propuesta:**
- Demo gratuito para miembros
- 15-20% descuento primer año
- Co-marketing

### Métricas de Validación B2B

- [ ] 3 flotas usando dashboard activamente
- [ ] 1 evento de alerta real gestionado
- [ ] NPS > 8 de fleet managers
- [ ] 1 cliente pagando post-trial

---

## Secuencia de Implementación

### Hacer AHORA (preparación)

1. Renombrar `apps/web` → `apps/platform`
2. Crear `apps/landing` para marketing B2C
3. Agregar `organizationId` opcional al schema de usuarios

### NO hacer hasta validar B2C

- Dashboard fleet manager completo
- Sistema de billing B2B
- Endpoints de organizations/vehicles
- Integraciones Ably para real-time flotas

### Triggers para Activar B2B

- 1,000+ usuarios activos en app móvil
- Al menos 1 consulta inbound de empresa
- Retention >40% D30
- Producto estable

---

## Fase 2: API para Aseguradoras

**Postponed** hasta tener tracción con flotas.

**Concepto:**
- API REST pública sobre endpoints ORPC existentes
- API keys + rate limiting
- Documentación OpenAPI
- Pricing por API calls o por póliza activa

**Target:**
- Aseguradoras LATAM: Sura, Mapfre, AXA, Zurich, La Caja
- Propuesta: Reducir siniestros = reducir costos de claims

---

## Validación vs. Principios "Apps Rentables 2026"

| Principio | Gowai B2B |
|-----------|-----------|
| Nicho específico | ✅ Fleet weather protection LATAM |
| Problema doloroso | ✅ $2-7M ARS por siniestro |
| Validar antes de construir | ✅ B2C primero |
| Monetización clara | ✅ Tiers + por vehículo |
| Retención > volumen | ✅ Alertas diarias, reportes ROI |
