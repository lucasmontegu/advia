# Driwet v2.0 - UX/UI Redesign: Chat-First Experience

> **Tagline**: "Viaja seguro, llueva o truene"
> **Fecha**: 2025-01-23
> **Estado**: Aprobado para implementación

---

## 1. Resumen Ejecutivo

### Problema
La UX actual tiene fricción: header con buscador + chat abajo confunde sobre dónde interactuar. Los usuarios no entienden que Driwet es un copiloto inteligente, no solo otro mapa.

### Solución
Transformar Driwet en una experiencia **Chat-First** donde el usuario habla/escribe a un copiloto que entiende rutas, analiza clima, y sugiere paradas de forma proactiva.

### Diferenciador
- NO es: "Un mapa con clima"
- SÍ es: "Un copiloto que me habla, me avisa del clima, y me dice cuándo parar"

---

## 2. Decisiones de Diseño

### 2.1 Interacción Principal: Chat-First
- **Eliminar** search bar del header
- **Input expandible** en la parte inferior del mapa
- Chips de ruta (origen → destino) aparecen después de definir la ruta
- El mapa es el protagonista, el chat es el copiloto

### 2.2 Voz: STT + TTS Automático
- **Push-to-talk**: Mantener presionado para grabar, soltar para enviar
- **TTS automático** para respuestas (hands-free real)
- **Modo conducción**: Auto-detectado con velocidad > 10km/h
- **Futuro**: Wake word "Hey Driwet" + Live Activities

### 2.3 Componentes AI Interactivos
Cards inline en el chat usando `streamUI()`:
- `WeatherTimelineCard` - Clima en la ruta con timeline horizontal
- `StopSelectorCard` - Paradas recomendadas con acciones
- `AlertCard` - Alertas urgentes con recomendación de Driwet
- `DepartureTimeCard` - Mejor hora para salir
- `RouteCompareCard` - Comparar rutas alternativas

### 2.4 Visualización de Clima
- **Timeline horizontal** en el chat/suggestions
- **Ruta coloreada** por riesgo en el mapa (verde → rojo)
- **Progressive disclosure**: Timeline solo cuando es relevante

### 2.5 Recomendaciones de Paradas: Safety-First
Prioridad:
1. Clima peligroso adelante
2. Fatiga estimada (2h+ manejando)
3. Combustible
4. Servicios útiles

### 2.6 Sistema de Temas
- **Dark theme** para conducción nocturna (default)
- **Light theme** para uso diurno
- **Auto-switch** basado en hora o sensor de luz
- **Modo conducción**: Textos 15% más grandes, botones 56px mínimo

### 2.7 Onboarding (30 segundos)
3 slides que establecen el modelo mental:
1. "Hola, soy Driwet" - Es conversacional
2. "Te aviso antes del peligro" - Te protege del clima
3. "Hablamos mientras conduces" - Funciona con voz

---

## 3. Arquitectura Técnica

### 3.1 Stack de APIs
| Servicio | Proveedor | Uso |
|----------|-----------|-----|
| Clima + Alertas | OpenWeatherMap One Call 3.0 | Datos principales |
| Road Risk | Tomorrow.io | Índice de riesgo vial |
| Direcciones | Mapbox Directions API | Rutas y geometría |
| Geocoding | Mapbox Geocoding | Búsqueda de lugares |
| AI | Gemini Flash 2.0 + AI SDK 6 | Agente conversacional |

### 3.2 Costos Estimados por Usuario/Mes
| Tipo | Rutas/mes | Costo APIs | Margen con $5 |
|------|-----------|------------|---------------|
| Ocasional | 10 | ~$0.10-0.25 | ~$4.75-4.90 |
| Frecuente | 50 | ~$0.40-1.00 | ~$4.00-4.60 |
| Profesional | 150 | ~$1.10-2.50 | ~$2.50-3.90 |

### 3.3 Framework de Agente: AI SDK 6
```typescript
import { Agent } from 'ai';

const driwetAgent = new Agent({
  name: 'Driwet',
  model: google('gemini-2.0-flash'),
  system: SYSTEM_PROMPT,
  tools: driwetTools,
  maxSteps: 5,
});
```

**Herramientas del agente**:
- `parseRouteFromText` - Extrae origen/destino de texto natural
- `getRouteDirections` - Ruta con geometría
- `getCurrentWeather` - Clima actual
- `getWeatherForecast` - Pronóstico horario
- `getWeatherAlerts` - Alertas activas
- `analyzeRouteWeather` - Clima en toda la ruta
- `getRoadRiskIndex` - Riesgo vial (Tomorrow.io)
- `findSafeStops` - Paradas seguras
- `suggestStopForWeather` - Refugio por clima
- `suggestBestDepartureTime` - Mejor hora para salir
- `showWeatherTimeline` - Renderiza WeatherTimelineCard
- `showStopSelector` - Renderiza StopSelectorCard
- `showAlert` - Renderiza AlertCard
- `showDepartureOptions` - Renderiza DepartureTimeCard
- `showRouteComparison` - Renderiza RouteCompareCard

### 3.4 Memoria de Sesiones
```typescript
// packages/db/schema/chat-memory.ts
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  messages: jsonb('messages').$type<Message[]>().default([]),
  context: jsonb('context'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
});
```

### 3.5 Guardrails
**3 capas de protección**:

1. **Input Validation**
   - Longitud máxima: 500 caracteres
   - Detección de prompt injection
   - Filtro de temas bloqueados
   - Verificación de relevancia

2. **Rate Limiting** (Upstash Redis)
   - Anonymous: 5 req/hora
   - Free trial: 50 req/día
   - Subscribed: 200 req/día

3. **Output Sanitization**
   - Remoción de datos sensibles
   - Límite de longitud (2000 chars)
   - Verificación de no exposición de system prompt

---

## 4. Monetización

### Modelo
- **Precio**: $5 USD/mes
- **Trial**: 7 días completo
- **Sin tier free**: Valor claro desde el inicio

### Por qué $5/mes
- "Menos que un café al mes"
- Cubre APIs con margen saludable
- Precio de "compra impulsiva"
- Sostenible para escalar

### B2B (Futuro)
- Flotas: $10-15/usuario/mes
- Dashboard de monitoreo
- API access
- Soporte prioritario

---

## 5. Plan de Implementación

### Fase 1: MVP Core (Semanas 1-6)
**Objetivo**: Chat-first funcional con clima básico

- [ ] Eliminar search bar del header
- [ ] Nuevo input expandible
- [ ] Chips de ruta (origen → destino)
- [ ] Onboarding 3 slides
- [ ] Sistema de temas light/dark
- [ ] Migrar clima a OpenWeatherMap
- [ ] WeatherTimelineCard
- [ ] AlertCard

### Fase 2: Voz + Paradas (Semanas 7-10)
**Objetivo**: Experiencia hands-free

- [ ] Speech-to-Text (push-to-talk)
- [ ] Text-to-Speech para respuestas
- [ ] Estados visuales de grabación
- [ ] Detección modo conducción
- [ ] findSafeStops tool
- [ ] StopSelectorCard
- [ ] Integración Tomorrow.io (road risk)
- [ ] Ruta coloreada por riesgo

### Fase 3: Monetización (Semanas 11-13)
**Objetivo**: Revenue

- [ ] Trial 7 días
- [ ] Paywall post-trial
- [ ] Integración RevenueCat/Stripe
- [ ] Premium upgrade screen
- [ ] Trial countdown banner

### Fase 4: Inteligencia Avanzada (Semanas 15-19)
**Objetivo**: Diferenciación profunda

- [ ] suggestBestDepartureTime
- [ ] DepartureTimeCard
- [ ] RouteCompareCard
- [ ] Push notifications de clima
- [ ] Alertas pre-viaje
- [ ] Historial de rutas frecuentes
- [ ] Ubicaciones guardadas (Casa, Trabajo)

---

## 6. Métricas de Éxito

### UX
- **Time to first route**: < 30 segundos
- **Voice usage rate**: > 40% de sesiones
- **Task completion**: > 85%

### Business
- **Trial → Paid conversion**: > 15%
- **Monthly churn**: < 5%
- **NPS**: > 50

### Technical
- **Response latency**: < 2 segundos (p95)
- **API cost per user**: < $1.00/mes promedio
- **Uptime**: 99.5%

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Tomorrow.io pricing alto | Media | Alto | Negociar volumen o calcular road risk propio |
| OpenWeatherMap rate limits | Baja | Medio | Cache agresivo + Open-Meteo backup |
| Abuso del agente | Media | Medio | Guardrails implementados |
| Voice recognition en ruido | Media | Medio | Fallback a texto siempre disponible |
| Usuarios no entienden el valor | Media | Alto | Onboarding claro + marketing enfocado |

---

## 8. Futuro (V2+)

- Wake word "Hey Driwet"
- Live Activities (iOS) / Ongoing Notifications (Android)
- CarPlay / Android Auto
- Dashboard B2B para flotas
- Preferencias aprendidas del usuario
- Integración con calendario
- Compartir ETA con clima a contactos
- Widget de home screen

---

## Apéndice: Design Tokens

### Dark Theme
```
background: #0A0A0A
surface: #171717
surface-elevated: #262626
text-primary: #FAFAFA
text-secondary: #A3A3A3
primary: #818CF8
safe: #34D399
caution: #FBBF24
warning: #FB923C
danger: #F87171
```

### Light Theme
```
background: #FAFAFA
surface: #FFFFFF
surface-elevated: #F5F5F5
text-primary: #171717
text-secondary: #525252
primary: #4F46E5
safe: #10B981
caution: #F59E0B
warning: #F97316
danger: #EF4444
```
