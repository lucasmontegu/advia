# Advia Mobile App - Diseño Completo

**Fecha:** 2026-01-20
**Estado:** Aprobado

---

## Resumen Ejecutivo

App móvil de alertas climáticas con enfoque AI-first. El usuario interactúa con un mapa que muestra alertas en tiempo real y un chat IA integrado que sugiere rutas seguras y lugares de refugio.

---

## Modelo de Negocio

### Estructura de planes

| Plan | Características | Ads |
|------|----------------|-----|
| **Trial (7 días)** | Todo desbloqueado, anónimo | Sin ads |
| **Free** | Features limitadas | Banner + Rewarded ads |
| **Premium** | Todo ilimitado | Sin ads |

### Precios Premium
- Mensual: $4.99/mes
- Anual: $39.99/año (ahorra 33%)
- Procesado por Polar (fuera del App Store)

### Límites del plan Free
- Máximo 1 ubicación guardada
- 3 consultas de ruta por semana
- Alertas con posible delay
- Sin lugares de refugio
- Sin historial completo

### Monetización de usuarios Free
- **Banner ad**: Siempre visible entre contenido y tab bar (50-60px)
- **Rewarded ads**: "Mira un video para desbloquear 1 ruta extra"
- Soft upsell a Premium después de cada rewarded ad

---

## Stack Técnico

```
Framework:        Expo SDK 54 + Expo Router
UI Components:    HeroUI Native
Theming:          Uniwind (unificado con web)
Mapas:            Mapbox (estilo oscuro)
Auth:             Better Auth (Google + Apple + Magic Link)
Notifications:    expo-notifications
Ads:              react-native-google-mobile-ads
Fuente:           Nunito Sans (expo-google-fonts)
Iconos:           Hugeicons (react-native-hugeicons)
```

---

## Sistema de Diseño

### Paleta de Colores

```typescript
// theme/colors.ts
export const colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#171717',
    card: '#FFFFFF',
    cardForeground: '#171717',
    primary: '#4338CA',
    primaryForeground: '#EEF2FF',
    secondary: '#F5F5F5',
    secondaryForeground: '#2E2E2E',
    muted: '#F5F5F5',
    mutedForeground: '#737373',
    destructive: '#DC2626',
    border: '#E5E5E5',
  },
  dark: {
    background: '#171717',
    foreground: '#FAFAFA',
    card: '#262626',
    cardForeground: '#FAFAFA',
    primary: '#4F46E5',
    primaryForeground: '#EEF2FF',
    secondary: '#3A3A3A',
    secondaryForeground: '#FAFAFA',
    muted: '#3A3A3A',
    mutedForeground: '#A3A3A3',
    destructive: '#EF4444',
    border: 'rgba(255,255,255,0.1)',
  },
  alert: {
    extreme: '#DC2626',    // Tornados, huracanes
    severe: '#EA580C',     // Tormentas severas
    moderate: '#F59E0B',   // Lluvias fuertes
    minor: '#22C55E',      // Alertas menores
  },
  safe: '#10B981',         // Rutas seguras, refugios
}
```

### Tipografía
- **Familia:** Nunito Sans
- **Pesos:** 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Títulos:** Bold, 24/20/18px
- **Body:** Regular 16px, line-height 1.5
- **Captions:** Medium 14px, color mutedForeground

### Iconografía
- **UI general:** Hugeicons
- **Alertas en mapa:** Variantes filled con colores de severidad
- **Animaciones:** Pulse/glow sutil en alertas activas

### Radius
- Base: 10px (consistente con web: 0.625rem)

### Estilo visual del mapa
- Mapbox Dark style como base
- Polígonos de alerta: fill semitransparente + borde brillante
- Glow effect en bordes según severidad
- Ubicación del usuario: puck azul con ring pulsante

---

## Estructura de Pantallas

```
app/
├── _layout.tsx              # Root: providers + auth check
├── (auth)/                  # Grupo sin autenticación
│   ├── welcome.tsx          # Primera vez solamente
│   ├── sign-in.tsx          # Google → Apple → Magic Link
│   ├── email-input.tsx      # Input para magic link
│   └── verify.tsx           # Verificación magic link
├── (app)/                   # Requiere trial o cuenta
│   ├── _layout.tsx          # Tab navigator + ad banner
│   ├── (tabs)/
│   │   ├── index.tsx        # Tab 1: Mapa + Chat
│   │   ├── routes.tsx       # Tab 2: Rutas guardadas
│   │   └── profile.tsx      # Tab 3: Perfil/Settings
│   ├── route-detail.tsx     # Detalle de ruta + alternativas
│   ├── notifications.tsx    # Config de notificaciones
│   └── premium.tsx          # Modal de upgrade
```

---

## Flujo de Onboarding

### Primera vez
1. Splash animado (1-2 seg)
2. Welcome screen minimalista:
   - Logo + tagline "Tu co-piloto climático"
   - CTA "Comenzar gratis"
   - Caption "7 días con todo incluido"
3. → Mapa con trial anónimo activado

### Siguientes veces
- Splash → Mapa directo
- Tooltips contextuales en features no usadas

### Cuándo pedir login
- Trial expira
- Quiere sincronizar datos entre dispositivos
- Quiere guardar más de 1 ubicación

---

## Pantallas Detalladas

### Welcome Screen

```
┌─────────────────────────────────┐
│                                 │
│         [Logo Advia]            │
│                                 │
│     "Tu co-piloto climático"    │
│                                 │
│   Evita tormentas. Llega seguro.│
│                                 │
│   ┌─────────────────────────┐   │
│   │     Comenzar gratis     │   │
│   └─────────────────────────┘   │
│                                 │
│     7 días con todo incluido    │
│                                 │
└─────────────────────────────────┘
```

### Sign-In Screen

```
┌─────────────────────────────────┐
│  ←                              │
│                                 │
│     Inicia sesión               │
│     Sincroniza tus rutas y      │
│     alertas en todos tus        │
│     dispositivos                │
│                                 │
│   ┌─────────────────────────┐   │
│   │  G  Continuar con Google│   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │    Continuar con Apple  │   │
│   └─────────────────────────┘   │
│                                 │
│   ─────────── o ───────────     │
│                                 │
│   ┌─────────────────────────┐   │
│   │  📧  Continuar con email│   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Tab 1: Mapa + Chat

```
┌─────────────────────────────────┐
│ ☰  Advia            📍 Mi zona  │
├─────────────────────────────────┤
│  ┌───────────────────────┐      │
│  │  🌩️ Alerta severa     │      │
│  │  Tormenta a 15km →    │      │
│  └───────────────────────┘      │
│                                 │
│         [MAPA MAPBOX]           │
│    ⚡        🌧️                 │
│         ●                       │
│              🌪️                 │
│    ┌──┐  ┌──┐                   │
│    │＋│  │◎ │                   │
│    └──┘  └──┘                   │
│                                 │
├─────────────────────────────────┤
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │
│  💬 ¿A dónde vas hoy?           │
│  "Mi ruta al trabajo"  "Alertas"│
│  ┌─────────────────────────┬──┐ │
│  │ Escribe un mensaje...   │➤ │ │
│  └─────────────────────────┴──┘ │
├─────────────────────────────────┤
│   🗺️        📍        👤        │
│  Mapa     Rutas    Perfil       │
└─────────────────────────────────┘
```

**Comportamiento del chat bottom sheet:**
- Estado colapsado: Solo input + sugerencias rápidas
- Drag hacia arriba: Expande hasta 60% de pantalla
- Interacción con mapa: IA puede dibujar rutas, marcar refugios

### Tab 2: Mis Rutas

```
┌─────────────────────────────────┐
│     Mis Rutas                   │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 🏠 → 🏢  Casa → Trabajo      ││
│  │ 12.4 km · ✅ Sin alertas     ││
│  │ Monitoreo activo        →   ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🏠 → 🏫  Casa → Escuela      ││
│  │ 5.2 km · ⚠️ Lluvia 4pm      ││
│  │ Monitoreo activo        →   ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ + Agregar nueva ruta         ││
│  └─────────────────────────────┘│
│                                 │
│  ─────── Historial ───────      │
│                                 │
│  📍 Ayer · Evitaste tormenta    │
│     Ahorro estimado: ~$150      │
│                                 │
├─────────────────────────────────┤
│   🗺️        📍        👤        │
└─────────────────────────────────┘
```

### Tab 3: Perfil

```
┌─────────────────────────────────┐
│     Perfil                      │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │  👤  lucas@email.com         ││
│  │      Plan: Premium      →   ││
│  └─────────────────────────────┘│
│                                 │
│  📊 Estadísticas                │
│  ┌─────────────────────────────┐│
│  │ 🌩️ 12 tormentas evitadas    ││
│  │ 💰 ~$2,400 ahorrados        ││
│  │ 🛣️ 847 km recorridos seguro ││
│  └─────────────────────────────┘│
│                                 │
│  ⚙️ Configuración               │
│  ├─ 🔔 Notificaciones       →  │
│  ├─ 📍 Ubicaciones guardadas → │
│  ├─ 🎨 Tema (Auto/Claro/Oscuro)│
│  ├─ 🌐 Idioma               →  │
│  └─ ❓ Ayuda y soporte      →  │
│                                 │
│  🚪 Cerrar sesión               │
├─────────────────────────────────┤
│   🗺️        📍        👤        │
└─────────────────────────────────┘
```

---

## Feature: Rutas Monitoreadas

### Flujo
1. Usuario guarda rutas frecuentes (casa → trabajo)
2. App monitorea alertas NOAA en esas rutas
3. Push notification cuando hay peligro
4. IA sugiere ruta alternativa + lugares de refugio
5. Deep link a Google Maps o Waze para navegación

### Lugares de refugio
La IA sugiere lugares seguros para detenerse:
- Estaciones de servicio techadas
- Centros comerciales
- Estacionamientos cubiertos
- Cualquier estructura sólida en la ruta

---

## Notificaciones Push

### Tipos

| Tipo | Trigger | Contenido |
|------|---------|-----------|
| Alerta crítica | Alerta extrema/severa en zona o ruta | "Alerta en tu ruta al trabajo. Tormenta severa a las 5pm." |
| Resumen diario | 8:00 AM | "Hoy despejado en tus rutas. Probabilidad de lluvia 20% 6pm." |
| Post-viaje | Llegó a destino evitando alerta | "¡Llegaste seguro! Evitaste tormenta. Ahorro: ~$300" |
| Trial expira | 1 día antes de fin de trial | "Tu trial termina mañana. Suscríbete para mantener acceso." |

### Configuración (usuario puede ajustar)
- Toggle: Alertas en tiempo real
- Toggle: Resumen inteligente diario
- Selector: Nivel mínimo (Extremo, Severo, Moderado, Todos)
- Toggle: Alertas solo en mis rutas
- Horario de silencio

---

## Gamificación

### Métricas trackeadas
- Tormentas evitadas (total)
- Ahorro acumulado estimado (basado en daños promedio)
- Kilómetros recorridos seguros
- Racha actual de viajes seguros

### Pantalla de logro (post-viaje)

```
┌─────────────────────────────────┐
│         🛡️                      │
│     ¡Viaje completado!          │
│                                 │
│   Evitaste una tormenta severa  │
│   con granizo de 2cm            │
│                                 │
│   ┌─────────────────────────┐   │
│   │  💰 Ahorro estimado     │   │
│   │      ~$350              │   │
│   └─────────────────────────┘   │
│                                 │
│   Racha actual: 🔥 5 viajes     │
│                                 │
│   ┌─────────────────────────┐   │
│   │     Compartir 📤        │   │
│   └─────────────────────────┘   │
│                                 │
│         Continuar               │
└─────────────────────────────────┘
```

### Badges (futuro)
- "Previsor" - Primera tormenta evitada
- "Cazador de tormentas" - 10 tormentas evitadas
- "Invencible" - 30 días sin exponerse a alertas
- etc.

---

## Modales de Monetización

### Premium Upgrade

```
┌─────────────────────────────────┐
│              ✕                  │
│         ⭐ Advia Premium        │
│                                 │
│   ✓ Rutas ilimitadas            │
│   ✓ Alertas en tiempo real      │
│   ✓ Sin anuncios                │
│   ✓ Lugares de refugio          │
│   ✓ Historial completo          │
│   ✓ Múltiples ubicaciones       │
│                                 │
│   ┌─────────────────────────┐   │
│   │  $4.99/mes              │   │
│   │  Suscribirse ahora      │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  $39.99/año (ahorra 33%)│   │
│   └─────────────────────────┘   │
│                                 │
│   Cancela cuando quieras        │
└─────────────────────────────────┘
```

**Triggers:**
- Intenta usar feature premium en Free
- Trial de 7 días expira
- Botón "Upgrade" en perfil
- Después de rewarded ad (soft upsell)

### Rewarded Ad

```
┌─────────────────────────────────┐
│     🎁 Desbloquea 1 ruta extra  │
│                                 │
│     Mira un video corto para    │
│     obtener una consulta de     │
│     ruta adicional gratis       │
│                                 │
│   ┌─────────────────────────┐   │
│   │   ▶️  Ver video (30s)   │   │
│   └─────────────────────────┘   │
│                                 │
│        No gracias               │
│                                 │
│   ─────────────────────────     │
│   ¿Sin interrupciones?          │
│   Prueba Premium →              │
└─────────────────────────────────┘
```

---

## Dependencias a Instalar

```bash
# UI y theming
npx expo install expo-font @expo-google-fonts/nunito-sans
npm install react-native-hugeicons

# Auth
npm install @better-auth/expo

# Ads
npx expo install expo-ads-admob
# o
npm install react-native-google-mobile-ads

# Notificaciones
npx expo install expo-notifications expo-device

# Navegación externa
npx expo install expo-linking
```

---

## Próximos Pasos

1. Configurar theme system con colores unificados
2. Implementar flujo de auth (Google + Apple + Magic Link)
3. Crear pantallas de onboarding (Welcome, Sign-in)
4. Rediseñar Tab 1 con nuevo estilo de mapa + chat
5. Implementar Tab 2 (Rutas) y Tab 3 (Perfil)
6. Integrar sistema de ads (banner + rewarded)
7. Configurar notificaciones push
8. Implementar lógica de trial/premium
9. Agregar gamificación post-viaje

---

*Documento generado durante sesión de brainstorming con Claude*
