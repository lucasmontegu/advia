# Fullscreen Map Experience Design

## Overview

Rediseño de la pantalla principal de Driwet para ofrecer una experiencia de mapa fullscreen con input inteligente de rutas, sugerencias contextuales y chat integrado.

## Objetivos

1. Mapa edge-to-edge que se extienda detrás del notch
2. Input de búsqueda inteligente con detección de patrones y tokens visuales
3. Sheet de sugerencias con información de ruta, paradas y destino
4. Chat fijo para consultas rápidas
5. Navegación compacta reorganizada

## Estructura de pantalla

```
┌─────────────────────────────────────────────┐
│░░░░░░░░░░░░░░ NOTCH ░░░░░░░░░░░░░░░│
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ [📍 Córdoba] → [🎯 Buenos Aires] ✕ │    │ ← Smart input
│  └─────────────────────────────────────┘    │
│                                             │
│    ╭─────────────────────────────────╮      │
│    │                                 │      │
│    │   MAPA FULL SCREEN              │      │
│    │   + Ruta dibujada               │      │
│    │   + Radar tormentas overlay     │      │
│    │   + Markers de paradas          │      │
│    │                                 │      │
│    ╰─────────────────────────────────╯      │
│                                             │
│                         [💡 Sugerencias]    │ ← FAB
│                                             │
├─────────────────────────────────────────────┤
│  💬 Pregunta sobre tu ruta...          [➤] │
├─────────────────────────────────────────────┤
│     🗺️           📍           👤           │
│    Mapa        Rutas       Perfil          │
└─────────────────────────────────────────────┘
```

## Componentes

### 1. Smart Search Input

Input inteligente que detecta patrones naturales y convierte direcciones en tokens visuales.

**Patrones soportados:**
- "de X a Y" / "desde X hasta Y"
- "X → Y" / "X a Y"
- "salgo de X voy a Y"

**Estados:**

```
Estado 1: Vacío
┌─────────────────────────────────────────────┐
│ 🔍 ¿A dónde vas? Ej: "de Córdoba a BsAs"   │
└─────────────────────────────────────────────┘

Estado 2: Escribiendo (con autocomplete)
┌─────────────────────────────────────────────┐
│ de cordo|                                   │
│  ┌────────────────────────┐                 │
│  │ 📍 Córdoba, Argentina  │                 │
│  │ 📍 Córdoba, España     │                 │
│  └────────────────────────┘                 │
└─────────────────────────────────────────────┘

Estado 3: Origen confirmado
┌─────────────────────────────────────────────┐
│ de [📍 Córdoba, AR] a |                     │
└─────────────────────────────────────────────┘

Estado 4: Ruta completa
┌─────────────────────────────────────────────┐
│ [📍 Córdoba, AR] → [🎯 Buenos Aires, AR] ✕ │
└─────────────────────────────────────────────┘
```

**Comportamiento de tokens:**
- Fondo semitransparente (azul para origen, rojo para destino)
- Tap en token permite editar/cambiar
- Botón ✕ limpia toda la búsqueda
- Ruta se dibuja automáticamente al completar

### 2. Suggestions Sheet

Bottom sheet con secciones colapsables que muestra información contextual de la ruta.

**Estructura:**

```
┌─────────────────────────────────────────────┐
│  ─────  (drag handle)                       │
│                                             │
│  📍 Córdoba → Buenos Aires                  │
│  ┌─────────┬─────────┬─────────┐            │
│  │ 150 km  │ 2h 10m  │  22°C   │            │
│  │Distancia│ Tiempo  │  Clima  │            │
│  └─────────┴─────────┴─────────┘            │
├─────────────────────────────────────────────┤
│  ⚠️ Alertas en ruta                    [▼] │
│  - Lluvia moderada km 45-78                 │
│  - Tormenta severa cerca destino            │
├─────────────────────────────────────────────┤
│  ⛽ Paradas sugeridas                  [▼] │
│  - Estación YPF - km 67                     │
│  - Parador El Cruce - km 120                │
├─────────────────────────────────────────────┤
│  👥 En tu destino                      [▼] │
│  - Concurrencia en playas/ríos              │
│  - Lugares populares                        │
├─────────────────────────────────────────────┤
│  [🗺️ Abrir en Google Maps]                 │
│  [🚗 Abrir en Waze]                         │
└─────────────────────────────────────────────┘
```

**Snap points:**
- Minimizado: solo resumen de ruta
- Medio: alertas visibles
- Expandido: todas las secciones

### 3. Chat Input Bar

Input compacto siempre visible para consultas rápidas.

**Características:**
- Altura compacta (48px)
- Placeholder contextual
- Expande hacia arriba al activarse
- Se oculta cuando el suggestions sheet está abierto

### 4. Compact Tabs

Navegación reducida con 3 tabs principales.

**Tabs:**
- 🗺️ Mapa (pantalla principal)
- 📍 Rutas (rutas guardadas)
- 👤 Perfil

**Estilo:**
- Iconos 24px con labels 10px
- Tab activo con color primario
- Safe area respetada para home indicator

## Archivos a crear/modificar

### Nuevos componentes:
1. `components/smart-search-input.tsx` - Input con detección de patrones y tokens
2. `components/suggestions-sheet.tsx` - Bottom sheet con secciones colapsables
3. `components/chat-input-bar.tsx` - Chat compacto fijo
4. `components/suggestions/route-summary.tsx` - Resumen de ruta
5. `components/suggestions/alerts-section.tsx` - Sección de alertas
6. `components/suggestions/stops-section.tsx` - Sección de paradas
7. `components/suggestions/destination-section.tsx` - Sección de destino

### Modificaciones:
1. `app/(app)/(tabs)/index.tsx` - Refactor layout principal para fullscreen
2. `app/(app)/(tabs)/_layout.tsx` - Tabs compactos
3. `components/map-view.tsx` - Agregar soporte para stops markers

## Tecnologías

- `@gorhom/bottom-sheet` - Sheet de sugerencias
- `react-native-reanimated` - Animaciones de tokens
- Mapbox Geocoding API - Autocompletado de direcciones
- Mapbox Directions API - Cálculo de rutas
- `react-native-safe-area-context` - Manejo de safe areas
- `expo-linking` - Abrir Google Maps/Waze

## Flujo de datos

```
User Input → Pattern Detection → Mapbox Geocoding
                                       ↓
                              Token Created
                                       ↓
                         Both tokens complete?
                                       ↓
                          Mapbox Directions API
                                       ↓
                    Route displayed + Weather API calls
                                       ↓
                         Suggestions sheet ready
```

## Consideraciones UX

1. **Feedback inmediato**: Autocomplete aparece después de 2 caracteres
2. **Tokens editables**: Tap para modificar, no bloquear al usuario
3. **Animaciones suaves**: Transiciones de 300ms para tokens y sheet
4. **Estado de carga**: Skeleton loaders en el sheet mientras carga
5. **Errores claros**: Mensajes específicos si no se encuentra dirección
