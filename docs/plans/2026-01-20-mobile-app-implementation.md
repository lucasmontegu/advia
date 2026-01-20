# Advia Mobile App - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la app móvil de Advia con flujo de autenticación, mapa con alertas, chat IA, sistema de rutas, y monetización (ads + premium).

**Architecture:** Expo Router con grupos de rutas `(auth)` y `(app)`. El grupo auth es público, el grupo app requiere trial activo o cuenta. Theme unificado con web usando colores OKLch convertidos. Bottom sheet para chat integrado con mapa.

**Tech Stack:** Expo SDK 54, Expo Router, HeroUI Native, Uniwind, Mapbox, Better Auth (Google + Apple + Magic Link), expo-notifications, react-native-google-mobile-ads, Nunito Sans, Hugeicons.

**Referencia de diseño:** `docs/plans/2026-01-20-mobile-app-design.md`

---

## Fase 1: Sistema de Theme

### Task 1.1: Crear archivo de colores unificado

**Files:**
- Create: `apps/native/theme/colors.ts`

**Step 1: Crear el archivo de colores**

```typescript
// apps/native/theme/colors.ts
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
    input: '#E5E5E5',
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
    input: 'rgba(255,255,255,0.15)',
  },
  // Colores compartidos (no cambian con theme)
  alert: {
    extreme: '#DC2626',
    severe: '#EA580C',
    moderate: '#F59E0B',
    minor: '#22C55E',
  },
  safe: '#10B981',
} as const;

export type ThemeColors = typeof colors.light;
export type AlertColors = typeof colors.alert;
```

**Step 2: Verificar que el archivo se creó correctamente**

Run: `cat apps/native/theme/colors.ts | head -20`

**Step 3: Commit**

```bash
git add apps/native/theme/colors.ts
git commit -m "feat(native): add unified color system matching web theme"
```

---

### Task 1.2: Crear hook useThemeColors

**Files:**
- Create: `apps/native/hooks/use-theme-colors.ts`

**Step 1: Crear el hook**

```typescript
// apps/native/hooks/use-theme-colors.ts
import { useMemo } from 'react';
import { useAppTheme } from '@/contexts/app-theme-context';
import { colors, type ThemeColors } from '@/theme/colors';

export function useThemeColors(): ThemeColors & { alert: typeof colors.alert; safe: string } {
  const { isDark } = useAppTheme();

  return useMemo(() => ({
    ...(isDark ? colors.dark : colors.light),
    alert: colors.alert,
    safe: colors.safe,
  }), [isDark]);
}
```

**Step 2: Commit**

```bash
git add apps/native/hooks/use-theme-colors.ts
git commit -m "feat(native): add useThemeColors hook"
```

---

### Task 1.3: Crear archivo de constantes de diseño

**Files:**
- Create: `apps/native/theme/constants.ts`

**Step 1: Crear constantes de diseño**

```typescript
// apps/native/theme/constants.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
```

**Step 2: Crear índice del theme**

```typescript
// apps/native/theme/index.ts
export * from './colors';
export * from './constants';
```

**Step 3: Commit**

```bash
git add apps/native/theme/constants.ts apps/native/theme/index.ts
git commit -m "feat(native): add design constants (spacing, radius, typography)"
```

---

## Fase 2: Configurar Fuentes

### Task 2.1: Instalar Nunito Sans

**Step 1: Instalar dependencias**

Run: `cd apps/native && pnpm add @expo-google-fonts/nunito-sans expo-splash-screen`

**Step 2: Commit**

```bash
git add apps/native/package.json pnpm-lock.yaml
git commit -m "deps(native): add nunito-sans font and splash-screen"
```

---

### Task 2.2: Configurar carga de fuentes en layout

**Files:**
- Modify: `apps/native/app/_layout.tsx`

**Step 1: Actualizar el layout root con carga de fuentes**

Reemplazar el contenido completo de `apps/native/app/_layout.tsx`:

```typescript
// apps/native/app/_layout.tsx
import '@/global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';

import { AppThemeProvider } from '@/contexts/app-theme-context';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <AppThemeProvider>
          <HeroUINativeProvider>
            <StackLayout />
          </HeroUINativeProvider>
        </AppThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
```

**Step 2: Verificar que compila**

Run: `cd apps/native && pnpm exec tsc --noEmit`

**Step 3: Commit**

```bash
git add apps/native/app/_layout.tsx
git commit -m "feat(native): configure Nunito Sans font loading"
```

---

## Fase 3: Estructura de Navegación

### Task 3.1: Crear grupo (auth) con layout

**Files:**
- Create: `apps/native/app/(auth)/_layout.tsx`

**Step 1: Crear layout del grupo auth**

```typescript
// apps/native/app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function AuthLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="email-input" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(auth\)/_layout.tsx
git commit -m "feat(native): add auth group layout"
```

---

### Task 3.2: Crear Welcome Screen

**Files:**
- Create: `apps/native/app/(auth)/welcome.tsx`

**Step 1: Crear pantalla de bienvenida**

```typescript
// apps/native/app/(auth)/welcome.tsx
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { startTrial } = useTrialStore();

  const handleStart = () => {
    startTrial();
    router.replace('/(app)/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo */}
        <View className="mb-8">
          <Text
            style={{
              fontFamily: 'NunitoSans_700Bold',
              fontSize: 48,
              color: colors.primary,
            }}
          >
            Advia
          </Text>
        </View>

        {/* Tagline */}
        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 24,
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Tu co-piloto climatico
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 16,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          Evita tormentas. Llega seguro.
        </Text>

        {/* CTA */}
        <Button
          onPress={handleStart}
          className="w-full"
          size="lg"
        >
          <Button.Label>Comenzar gratis</Button.Label>
        </Button>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 16,
          }}
        >
          7 dias con todo incluido
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(auth\)/welcome.tsx
git commit -m "feat(native): add welcome screen"
```

---

### Task 3.3: Crear Trial Store

**Files:**
- Create: `apps/native/stores/trial-store.ts`

**Step 1: Instalar zustand y persist storage**

Run: `cd apps/native && pnpm add zustand`

**Step 2: Crear el store**

```typescript
// apps/native/stores/trial-store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_DURATION_DAYS = 7;

interface TrialState {
  trialStartDate: string | null;
  isTrialActive: boolean;
  isPremium: boolean;

  startTrial: () => void;
  checkTrialStatus: () => boolean;
  setPremium: (value: boolean) => void;
  getRemainingDays: () => number;
}

export const useTrialStore = create<TrialState>()(
  persist(
    (set, get) => ({
      trialStartDate: null,
      isTrialActive: false,
      isPremium: false,

      startTrial: () => {
        const now = new Date().toISOString();
        set({ trialStartDate: now, isTrialActive: true });
      },

      checkTrialStatus: () => {
        const { trialStartDate, isPremium } = get();

        if (isPremium) return true;
        if (!trialStartDate) return false;

        const start = new Date(trialStartDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        const isActive = diffDays < TRIAL_DURATION_DAYS;
        set({ isTrialActive: isActive });
        return isActive;
      },

      setPremium: (value: boolean) => {
        set({ isPremium: value });
      },

      getRemainingDays: () => {
        const { trialStartDate, isPremium } = get();

        if (isPremium) return Infinity;
        if (!trialStartDate) return 0;

        const start = new Date(trialStartDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return Math.max(0, TRIAL_DURATION_DAYS - diffDays);
      },
    }),
    {
      name: 'advia-trial',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Step 3: Instalar AsyncStorage si no existe**

Run: `cd apps/native && pnpm add @react-native-async-storage/async-storage`

**Step 4: Commit**

```bash
git add apps/native/stores/trial-store.ts apps/native/package.json pnpm-lock.yaml
git commit -m "feat(native): add trial store with zustand persist"
```

---

### Task 3.4: Crear Sign-In Screen (Google + Apple + Magic Link)

**Files:**
- Create: `apps/native/app/(auth)/sign-in.tsx`

**Step 1: Crear pantalla de sign-in**

```typescript
// apps/native/app/(auth)/sign-in.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Divider } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    try {
      await authClient.signIn.social({
        provider: 'google',
      });
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading('apple');
    try {
      await authClient.signIn.social({
        provider: 'apple',
      });
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('Apple sign-in error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    router.push('/(auth)/email-input');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-6 pt-4">
        {/* Back button */}
        <Pressable onPress={() => router.back()} className="mb-8">
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Volver</Text>
        </Pressable>

        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          Inicia sesion
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 16,
            color: colors.mutedForeground,
            marginBottom: 32,
            lineHeight: 24,
          }}
        >
          Sincroniza tus rutas y alertas en todos tus dispositivos
        </Text>

        {/* Social buttons */}
        <View className="gap-3">
          <Button
            onPress={handleGoogleSignIn}
            variant="outline"
            size="lg"
            isDisabled={isLoading !== null}
          >
            <Button.Label>
              {isLoading === 'google' ? 'Conectando...' : 'Continuar con Google'}
            </Button.Label>
          </Button>

          <Button
            onPress={handleAppleSignIn}
            variant="outline"
            size="lg"
            isDisabled={isLoading !== null}
          >
            <Button.Label>
              {isLoading === 'apple' ? 'Conectando...' : 'Continuar con Apple'}
            </Button.Label>
          </Button>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text
            style={{
              marginHorizontal: 16,
              color: colors.mutedForeground,
              fontFamily: 'NunitoSans_400Regular',
            }}
          >
            o
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        {/* Email option */}
        <Button
          onPress={handleEmailSignIn}
          variant="ghost"
          size="lg"
        >
          <Button.Label>Continuar con email</Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(auth\)/sign-in.tsx
git commit -m "feat(native): add sign-in screen with social + email options"
```

---

### Task 3.5: Crear Email Input Screen (Magic Link)

**Files:**
- Create: `apps/native/app/(auth)/email-input.tsx`

**Step 1: Crear pantalla de input de email**

```typescript
// apps/native/app/(auth)/email-input.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextField } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';

export default function EmailInputScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: '/(app)/(tabs)',
      });
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim() },
      });
    } catch (err) {
      setError('Error al enviar el link. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-6 pt-4">
        {/* Back button */}
        <Pressable onPress={() => router.back()} className="mb-8">
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Volver</Text>
        </Pressable>

        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          Ingresa tu email
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 16,
            color: colors.mutedForeground,
            marginBottom: 32,
            lineHeight: 24,
          }}
        >
          Te enviaremos un link para iniciar sesion
        </Text>

        {/* Email input */}
        <TextField className="mb-4">
          <TextField.Input
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
          />
        </TextField>

        {error && (
          <Text
            style={{
              color: colors.destructive,
              marginBottom: 16,
              fontFamily: 'NunitoSans_400Regular',
            }}
          >
            {error}
          </Text>
        )}

        <Button
          onPress={handleSendMagicLink}
          size="lg"
          isDisabled={isLoading}
        >
          <Button.Label>
            {isLoading ? 'Enviando...' : 'Enviar magic link'}
          </Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(auth\)/email-input.tsx
git commit -m "feat(native): add email input screen for magic link"
```

---

### Task 3.6: Crear Verify Screen

**Files:**
- Create: `apps/native/app/(auth)/verify.tsx`

**Step 1: Crear pantalla de verificación**

```typescript
// apps/native/app/(auth)/verify.tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import * as Linking from 'expo-linking';

export default function VerifyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { email } = useLocalSearchParams<{ email: string }>();

  const handleOpenEmail = async () => {
    await Linking.openURL('mailto:');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 justify-center items-center px-8">
        {/* Icon */}
        <Text style={{ fontSize: 64, marginBottom: 24 }}>📧</Text>

        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 24,
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Revisa tu email
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 16,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: 8,
            lineHeight: 24,
          }}
        >
          Enviamos un link de acceso a
        </Text>

        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 16,
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          {email}
        </Text>

        <Button
          onPress={handleOpenEmail}
          variant="outline"
          size="lg"
          className="w-full mb-4"
        >
          <Button.Label>Abrir app de email</Button.Label>
        </Button>

        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: 'NunitoSans_400Regular',
            }}
          >
            Usar otro email
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(auth\)/verify.tsx
git commit -m "feat(native): add verify screen for magic link"
```

---

## Fase 4: Grupo (app) con Tabs

### Task 4.1: Crear layout del grupo (app)

**Files:**
- Create: `apps/native/app/(app)/_layout.tsx`

**Step 1: Crear layout con verificación de trial**

```typescript
// apps/native/app/(app)/_layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTrialStore } from '@/stores/trial-store';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function AppLayout() {
  const router = useRouter();
  const colors = useThemeColors();
  const { trialStartDate, checkTrialStatus, isPremium } = useTrialStore();

  useEffect(() => {
    // Si no hay trial ni premium, redirigir a welcome
    if (!trialStartDate && !isPremium) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Verificar si el trial sigue activo
    const isActive = checkTrialStatus();
    if (!isActive && !isPremium) {
      // Trial expirado, mostrar paywall o sign-in
      router.replace('/(auth)/sign-in');
    }
  }, [trialStartDate, isPremium]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="premium"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="route-detail"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(app\)/_layout.tsx
git commit -m "feat(native): add app group layout with trial check"
```

---

### Task 4.2: Crear Tab Layout

**Files:**
- Create: `apps/native/app/(app)/(tabs)/_layout.tsx`

**Step 1: Crear layout de tabs**

```typescript
// apps/native/app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';

// Tab icons (usando emojis temporalmente, reemplazar con Hugeicons)
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    index: '🗺️',
    routes: '📍',
    profile: '👤',
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
      {icons[name]}
    </Text>
  );
}

export default function TabLayout() {
  const colors = useThemeColors();
  const { isPremium } = useTrialStore();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarLabelStyle: {
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="index" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Rutas',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="routes" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="profile" focused={focused} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Banner Ad placeholder - solo para usuarios free */}
      {!isPremium && (
        <View
          style={{
            height: 50,
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            Ad Banner Placeholder
          </Text>
        </View>
      )}
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(app\)/\(tabs\)/_layout.tsx
git commit -m "feat(native): add tab layout with ad banner placeholder"
```

---

### Task 4.3: Crear Tab Mapa (index)

**Files:**
- Create: `apps/native/app/(app)/(tabs)/index.tsx`

**Step 1: Crear pantalla de mapa con chat**

```typescript
// apps/native/app/(app)/(tabs)/index.tsx
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { MapViewComponent } from '@/components/map-view';
import { ChatBottomSheet } from '@/components/chat-bottom-sheet';
import { AlertBanner } from '@/components/alert-banner';
import { useState } from 'react';

export default function MapScreen() {
  const colors = useThemeColors();
  const [alerts, setAlerts] = useState([]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.card }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'NunitoSans_700Bold',
              fontSize: 20,
              color: colors.foreground,
            }}
          >
            Advia
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 16 }}>📍</Text>
            <Text
              style={{
                fontFamily: 'NunitoSans_400Regular',
                fontSize: 14,
                color: colors.mutedForeground,
              }}
            >
              Mi zona
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Alert Banner (si hay alertas activas) */}
      <AlertBanner />

      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapViewComponent alerts={alerts} />
      </View>

      {/* Chat Bottom Sheet */}
      <ChatBottomSheet />
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(app\)/\(tabs\)/index.tsx
git commit -m "feat(native): add map tab screen with chat integration"
```

---

### Task 4.4: Crear componente AlertBanner

**Files:**
- Create: `apps/native/components/alert-banner.tsx`

**Step 1: Crear componente de banner de alerta**

```typescript
// apps/native/components/alert-banner.tsx
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface AlertBannerProps {
  alert?: {
    type: string;
    severity: 'extreme' | 'severe' | 'moderate' | 'minor';
    distance?: string;
  };
}

export function AlertBanner({ alert }: AlertBannerProps) {
  const colors = useThemeColors();

  // Por ahora mostrar un alert de ejemplo si no hay ninguno
  if (!alert) {
    return null;
  }

  const severityColors = {
    extreme: colors.alert.extreme,
    severe: colors.alert.severe,
    moderate: colors.alert.moderate,
    minor: colors.alert.minor,
  };

  const severityLabels = {
    extreme: 'Alerta extrema',
    severe: 'Alerta severa',
    moderate: 'Alerta moderada',
    minor: 'Alerta menor',
  };

  return (
    <Pressable
      style={{
        backgroundColor: severityColors[alert.severity],
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 14,
            color: '#FFFFFF',
          }}
        >
          {severityLabels[alert.severity]}
        </Text>
        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 12,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {alert.type} {alert.distance && `a ${alert.distance}`}
        </Text>
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 16 }}>→</Text>
    </Pressable>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/components/alert-banner.tsx
git commit -m "feat(native): add alert banner component"
```

---

### Task 4.5: Crear ChatBottomSheet

**Files:**
- Create: `apps/native/components/chat-bottom-sheet.tsx`

**Step 1: Crear componente de chat bottom sheet**

```typescript
// apps/native/components/chat-bottom-sheet.tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useChat } from '@ai-sdk/react';

const QUICK_SUGGESTIONS = [
  'Mi ruta al trabajo',
  'Alertas cercanas',
  '¿Va a llover hoy?',
];

export function ChatBottomSheet() {
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['15%', '50%', '80%'], []);

  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: '/api/chat', // Ajustar a tu endpoint
  });

  const handleSend = () => {
    if (input.trim()) {
      handleSubmit();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Chat messages */}
        {messages.length > 0 && (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: item.role === 'user' ? colors.primary : colors.muted,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginBottom: 8,
                  maxWidth: '80%',
                }}
              >
                <Text
                  style={{
                    color: item.role === 'user' ? colors.primaryForeground : colors.foreground,
                    fontFamily: 'NunitoSans_400Regular',
                  }}
                >
                  {item.content}
                </Text>
              </View>
            )}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}

        {/* Quick suggestions (solo si no hay mensajes) */}
        {messages.length === 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontFamily: 'NunitoSans_400Regular',
                fontSize: 14,
                color: colors.mutedForeground,
                marginBottom: 8,
              }}
            >
              💬 ¿A donde vas hoy?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  style={{
                    backgroundColor: colors.muted,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: 'NunitoSans_400Regular',
                      fontSize: 13,
                    }}
                  >
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 24,
              color: colors.foreground,
              fontFamily: 'NunitoSans_400Regular',
            }}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              backgroundColor: input.trim() ? colors.primary : colors.muted,
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>➤</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/components/chat-bottom-sheet.tsx
git commit -m "feat(native): add chat bottom sheet component"
```

---

### Task 4.6: Crear Tab Rutas

**Files:**
- Create: `apps/native/app/(app)/(tabs)/routes.tsx`

**Step 1: Crear pantalla de rutas**

```typescript
// apps/native/app/(app)/(tabs)/routes.tsx
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

// Datos de ejemplo
const SAVED_ROUTES = [
  {
    id: '1',
    name: 'Casa → Trabajo',
    from: '🏠',
    to: '🏢',
    distance: '12.4 km',
    status: 'clear' as const,
    statusText: 'Sin alertas',
  },
  {
    id: '2',
    name: 'Casa → Escuela',
    from: '🏠',
    to: '🏫',
    distance: '5.2 km',
    status: 'warning' as const,
    statusText: 'Lluvia 4pm',
  },
];

const HISTORY = [
  {
    id: '1',
    date: 'Ayer',
    event: 'Evitaste tormenta',
    savings: '~$150',
  },
  {
    id: '2',
    date: 'Lun 13',
    event: 'Ruta segura',
    savings: null,
  },
];

export default function RoutesScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 24,
          }}
        >
          Mis Rutas
        </Text>

        {/* Saved Routes */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          {SAVED_ROUTES.map((route) => (
            <Pressable
              key={route.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 20 }}>{route.from}</Text>
                <Text style={{ marginHorizontal: 8, color: colors.mutedForeground }}>→</Text>
                <Text style={{ fontSize: 20 }}>{route.to}</Text>
                <Text
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'NunitoSans_400Regular',
                    color: colors.mutedForeground,
                  }}
                >
                  {route.distance}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>
                    {route.status === 'clear' ? '✅' : '⚠️'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'NunitoSans_400Regular',
                      color: route.status === 'clear' ? colors.safe : colors.alert.moderate,
                    }}
                  >
                    {route.statusText}
                  </Text>
                </View>
                <Text style={{ color: colors.mutedForeground }}>→</Text>
              </View>
            </Pressable>
          ))}

          {/* Add new route */}
          <Pressable
            style={{
              backgroundColor: colors.muted,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'NunitoSans_600SemiBold',
                color: colors.primary,
              }}
            >
              + Agregar nueva ruta
            </Text>
          </Pressable>
        </View>

        {/* History */}
        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 18,
            color: colors.foreground,
            marginBottom: 16,
          }}
        >
          Historial
        </Text>

        <View style={{ gap: 12 }}>
          {HISTORY.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 16 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'NunitoSans_400Regular',
                    color: colors.mutedForeground,
                    fontSize: 12,
                  }}
                >
                  {item.date}
                </Text>
                <Text
                  style={{
                    fontFamily: 'NunitoSans_600SemiBold',
                    color: colors.foreground,
                  }}
                >
                  {item.event}
                </Text>
                {item.savings && (
                  <Text
                    style={{
                      fontFamily: 'NunitoSans_400Regular',
                      color: colors.safe,
                      fontSize: 14,
                    }}
                  >
                    Ahorro estimado: {item.savings}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(app\)/\(tabs\)/routes.tsx
git commit -m "feat(native): add routes tab screen"
```

---

### Task 4.7: Crear Tab Perfil

**Files:**
- Create: `apps/native/app/(app)/(tabs)/profile.tsx`

**Step 1: Crear pantalla de perfil**

```typescript
// apps/native/app/(app)/(tabs)/profile.tsx
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTrialStore } from '@/stores/trial-store';
import { authClient } from '@/lib/auth-client';

const STATS = [
  { icon: '🌩️', label: '12 tormentas evitadas' },
  { icon: '💰', label: '~$2,400 ahorrados' },
  { icon: '🛣️', label: '847 km recorridos seguro' },
];

const SETTINGS = [
  { icon: '🔔', label: 'Notificaciones', route: '/notifications' },
  { icon: '📍', label: 'Ubicaciones guardadas', route: '/locations' },
  { icon: '🎨', label: 'Tema', route: null, value: 'Auto' },
  { icon: '🌐', label: 'Idioma', route: null, value: 'Español' },
  { icon: '❓', label: 'Ayuda y soporte', route: '/help' },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { isPremium, getRemainingDays } = useTrialStore();
  const remainingDays = getRemainingDays();

  const handleLogout = async () => {
    await authClient.signOut();
    router.replace('/(auth)/welcome');
  };

  const handleUpgrade = () => {
    router.push('/(app)/premium');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 24,
          }}
        >
          Perfil
        </Text>

        {/* User Card */}
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'NunitoSans_600SemiBold',
                  color: colors.foreground,
                  fontSize: 16,
                }}
              >
                usuario@email.com
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  style={{
                    fontFamily: 'NunitoSans_400Regular',
                    color: isPremium ? colors.primary : colors.mutedForeground,
                    fontSize: 14,
                  }}
                >
                  {isPremium ? 'Plan: Premium' : `Trial: ${remainingDays} días restantes`}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <Pressable onPress={handleUpgrade}>
                <Text style={{ color: colors.primary, fontFamily: 'NunitoSans_600SemiBold' }}>
                  Upgrade
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>

        {/* Stats */}
        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 16,
            color: colors.mutedForeground,
            marginBottom: 12,
          }}
        >
          📊 Estadisticas
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
            gap: 12,
          }}
        >
          {STATS.map((stat, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
              <Text
                style={{
                  fontFamily: 'NunitoSans_400Regular',
                  color: colors.foreground,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <Text
          style={{
            fontFamily: 'NunitoSans_600SemiBold',
            fontSize: 16,
            color: colors.mutedForeground,
            marginBottom: 12,
          }}
        >
          ⚙️ Configuracion
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
          }}
        >
          {SETTINGS.map((setting, index) => (
            <Pressable
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: index < SETTINGS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>{setting.icon}</Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'NunitoSans_400Regular',
                  color: colors.foreground,
                }}
              >
                {setting.label}
              </Text>
              {setting.value && (
                <Text
                  style={{
                    fontFamily: 'NunitoSans_400Regular',
                    color: colors.mutedForeground,
                    marginRight: 8,
                  }}
                >
                  {setting.value}
                </Text>
              )}
              <Text style={{ color: colors.mutedForeground }}>→</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <Text
            style={{
              fontFamily: 'NunitoSans_400Regular',
              color: colors.destructive,
            }}
          >
            Cerrar sesion
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(app\)/\(tabs\)/profile.tsx
git commit -m "feat(native): add profile tab screen"
```

---

## Fase 5: Premium Modal

### Task 5.1: Crear Premium Modal

**Files:**
- Create: `apps/native/app/(app)/premium.tsx`

**Step 1: Crear pantalla modal de premium**

```typescript
// apps/native/app/(app)/premium.tsx
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

const FEATURES = [
  'Rutas ilimitadas',
  'Alertas en tiempo real',
  'Sin anuncios',
  'Lugares de refugio',
  'Historial completo',
  'Multiples ubicaciones',
];

export default function PremiumScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    // TODO: Integrar con Polar
    console.log('Subscribe to:', plan);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, alignItems: 'center' }}
      >
        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-end', padding: 8 }}
        >
          <Text style={{ fontSize: 24, color: colors.mutedForeground }}>✕</Text>
        </Pressable>

        {/* Header */}
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⭐</Text>
        <Text
          style={{
            fontFamily: 'NunitoSans_700Bold',
            fontSize: 28,
            color: colors.foreground,
            marginBottom: 24,
          }}
        >
          Advia Premium
        </Text>

        {/* Features */}
        <View style={{ width: '100%', marginBottom: 32 }}>
          {FEATURES.map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.safe, fontSize: 18 }}>✓</Text>
              <Text
                style={{
                  fontFamily: 'NunitoSans_400Regular',
                  fontSize: 16,
                  color: colors.foreground,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={{ width: '100%', gap: 12 }}>
          <Button
            onPress={() => handleSubscribe('monthly')}
            size="lg"
            className="w-full"
          >
            <Button.Label>$4.99/mes</Button.Label>
          </Button>

          <Button
            onPress={() => handleSubscribe('yearly')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Button.Label>$39.99/año (ahorra 33%)</Button.Label>
          </Button>
        </View>

        {/* Footer */}
        <Text
          style={{
            fontFamily: 'NunitoSans_400Regular',
            fontSize: 12,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          Cancela cuando quieras{'\n'}
          Pago procesado por Polar
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add apps/native/app/\(app\)/premium.tsx
git commit -m "feat(native): add premium upgrade modal"
```

---

## Fase 6: Limpiar archivos antiguos

### Task 6.1: Eliminar estructura drawer antigua

**Step 1: Eliminar archivos del drawer antiguo**

Run: `rm -rf apps/native/app/\(drawer\)`

**Step 2: Verificar estructura**

Run: `ls -la apps/native/app/`

Expected output should show:
- `_layout.tsx`
- `(auth)/`
- `(app)/`
- `modal.tsx`
- `+not-found.tsx`

**Step 3: Commit**

```bash
git add -A apps/native/app/
git commit -m "refactor(native): remove old drawer navigation structure"
```

---

## Fase 7: Configurar Auth con Social + Magic Link

### Task 7.1: Actualizar Better Auth config para social providers

**Files:**
- Modify: `packages/auth/src/index.ts`

**Step 1: Agregar configuración de social providers y magic link**

Actualizar `packages/auth/src/index.ts` para agregar los providers:

```typescript
// packages/auth/src/index.ts
import { db } from "@advia/db";
import * as schema from "@advia/db/schema/auth";
import { env } from "@advia/env/server";
import { expo } from "@better-auth/expo";
import { magicLink } from "better-auth/plugins";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { polarClient } from "./lib/payments";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN, "advia://", "exp://"],
  emailAndPassword: {
    enabled: false, // Deshabilitado, usamos magic link
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: Implementar envío de email
        console.log(`Magic link for ${email}: ${url}`);
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true,
      use: [
        checkout({
          products: [
            {
              productId: env.POLAR_PRODUCT_ID,
              slug: "premium",
            },
          ],
          successUrl: env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }),
    nextCookies(),
    expo(),
  ],
});
```

**Step 2: Commit**

```bash
git add packages/auth/src/index.ts
git commit -m "feat(auth): add Google, Apple, and Magic Link providers"
```

---

### Task 7.2: Agregar variables de entorno necesarias

**Files:**
- Modify: `packages/env/src/server.ts`

**Step 1: Agregar nuevas variables de entorno al schema**

Agregar las siguientes variables al schema de Zod en `packages/env/src/server.ts`:

```typescript
// Agregar a las variables existentes
GOOGLE_CLIENT_ID: z.string().min(1),
GOOGLE_CLIENT_SECRET: z.string().min(1),
APPLE_CLIENT_ID: z.string().min(1),
APPLE_CLIENT_SECRET: z.string().min(1),
POLAR_PRODUCT_ID: z.string().min(1),
```

**Step 2: Commit**

```bash
git add packages/env/src/server.ts
git commit -m "feat(env): add social auth environment variables"
```

---

## Fase 8: Testing y Verificación

### Task 8.1: Verificar que el proyecto compila

**Step 1: Verificar tipos TypeScript**

Run: `cd apps/native && pnpm exec tsc --noEmit`

**Step 2: Si hay errores, corregirlos**

Los errores comunes pueden ser:
- Imports faltantes
- Tipos incorrectos
- Paths no resueltos

**Step 3: Verificar que el servidor de desarrollo inicia**

Run: `cd apps/native && pnpm start`

**Step 4: Commit si hubo fixes**

```bash
git add -A
git commit -m "fix(native): resolve TypeScript errors"
```

---

## Resumen de Archivos Creados/Modificados

### Nuevos archivos:
- `apps/native/theme/colors.ts`
- `apps/native/theme/constants.ts`
- `apps/native/theme/index.ts`
- `apps/native/hooks/use-theme-colors.ts`
- `apps/native/stores/trial-store.ts`
- `apps/native/app/(auth)/_layout.tsx`
- `apps/native/app/(auth)/welcome.tsx`
- `apps/native/app/(auth)/sign-in.tsx`
- `apps/native/app/(auth)/email-input.tsx`
- `apps/native/app/(auth)/verify.tsx`
- `apps/native/app/(app)/_layout.tsx`
- `apps/native/app/(app)/(tabs)/_layout.tsx`
- `apps/native/app/(app)/(tabs)/index.tsx`
- `apps/native/app/(app)/(tabs)/routes.tsx`
- `apps/native/app/(app)/(tabs)/profile.tsx`
- `apps/native/app/(app)/premium.tsx`
- `apps/native/components/alert-banner.tsx`
- `apps/native/components/chat-bottom-sheet.tsx`

### Archivos modificados:
- `apps/native/app/_layout.tsx`
- `apps/native/package.json`
- `packages/auth/src/index.ts`
- `packages/env/src/server.ts`

### Archivos eliminados:
- `apps/native/app/(drawer)/*` (toda la carpeta)

---

## Próximos pasos (Fase 2 del proyecto)

Después de completar este plan, las siguientes fases serían:

1. **Integración de Hugeicons** - Reemplazar emojis con iconos reales
2. **Integración de Ads** - Configurar react-native-google-mobile-ads
3. **Push Notifications** - Configurar expo-notifications
4. **Gamificación** - Pantalla de logros post-viaje
5. **Deep linking** - Configurar links a Google Maps/Waze
6. **Testing E2E** - Tests con Maestro o Detox
