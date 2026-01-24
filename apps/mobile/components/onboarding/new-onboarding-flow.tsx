// apps/mobile/components/onboarding/new-onboarding-flow.tsx
import { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  withTiming,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { HookScreen } from './hook-screen';
import { PromiseScreen } from './promise-screen';
import { PersonalizationScreen, type TripType } from './personalization-screen';
import { DemoScreen } from './demo-screen';
import { SignupScreen } from './signup-screen';

const { width } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = '@driwet/onboarding-v2-complete';
const ONBOARDING_PREFERENCES_KEY = '@driwet/onboarding-preferences';

type OnboardingStep = 'hook' | 'promise' | 'personalization' | 'demo' | 'signup';

const STEPS: OnboardingStep[] = ['hook', 'promise', 'personalization', 'demo', 'signup'];

type NewOnboardingFlowProps = {
  onComplete: () => void;
  onCreateAccount: () => void;
};

export function NewOnboardingFlow({ onComplete, onCreateAccount }: NewOnboardingFlowProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('hook');
  const [tripPreferences, setTripPreferences] = useState<TripType[]>([]);

  const currentIndex = STEPS.indexOf(currentStep);
  const canSkip = currentIndex > 0 && currentStep !== 'signup';
  const canGoBack = currentIndex > 1; // Can go back after promise screen
  const showNavigation = currentStep !== 'hook' && currentStep !== 'signup';

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentIndex]);

  // Helper to save preferences and mark onboarding complete
  const saveOnboardingState = useCallback(async () => {
    try {
      if (tripPreferences.length > 0) {
        await AsyncStorage.setItem(
          ONBOARDING_PREFERENCES_KEY,
          JSON.stringify({ tripTypes: tripPreferences })
        );
      }
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still proceed - don't block user on storage failure
    }
  }, [tripPreferences]);

  const handleSkip = useCallback(async () => {
    await saveOnboardingState();
    onComplete();
  }, [saveOnboardingState, onComplete]);

  const handleCreateAccount = useCallback(async () => {
    await saveOnboardingState();
    onCreateAccount();
  }, [saveOnboardingState, onCreateAccount]);

  const handleContinueAsGuest = useCallback(async () => {
    await saveOnboardingState();
    onComplete();
  }, [saveOnboardingState, onComplete]);

  const handleHookComplete = useCallback(() => {
    setCurrentStep('promise');
  }, []);

  const renderScreen = () => {
    switch (currentStep) {
      case 'hook':
        return (
          <Pressable style={styles.screenContainer} onPress={handleHookComplete}>
            <HookScreen onComplete={handleHookComplete} />
          </Pressable>
        );
      case 'promise':
        return (
          <Animated.View
            key="promise"
            entering={SlideInRight.duration(400)}
            style={styles.screenContainer}
          >
            <PromiseScreen />
          </Animated.View>
        );
      case 'personalization':
        return (
          <Animated.View
            key="personalization"
            entering={SlideInRight.duration(400)}
            style={styles.screenContainer}
          >
            <PersonalizationScreen
              initialSelection={tripPreferences}
              onSelectionChange={setTripPreferences}
            />
          </Animated.View>
        );
      case 'demo':
        return (
          <Animated.View
            key="demo"
            entering={SlideInRight.duration(400)}
            style={styles.screenContainer}
          >
            <DemoScreen />
          </Animated.View>
        );
      case 'signup':
        return (
          <Animated.View
            key="signup"
            entering={SlideInRight.duration(400)}
            style={styles.screenContainer}
          >
            <SignupScreen
              onCreateAccount={handleCreateAccount}
              onContinueAsGuest={handleContinueAsGuest}
            />
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen content */}
      {renderScreen()}

      {/* Navigation overlay (skip, pagination, next) */}
      {showNavigation && (
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[
            styles.navigationOverlay,
            { paddingBottom: insets.bottom + 24 },
          ]}
          pointerEvents="box-none"
        >
          {/* Top bar with skip */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            {canGoBack ? (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.backButtonText, { color: colors.mutedForeground }]}>
                  ← {t('common.back')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}

            {canSkip && (
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipButtonText, { color: colors.mutedForeground }]}>
                  {t('onboarding.skip')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom bar with pagination and next */}
          <View style={styles.bottomBar}>
            {/* Pagination dots */}
            <View style={styles.pagination}>
              {STEPS.slice(1).map((step, index) => (
                <PaginationDot
                  key={step}
                  isActive={index + 1 === currentIndex}
                  isPast={index + 1 < currentIndex}
                  colors={colors}
                />
              ))}
            </View>

            {/* Next button - only show if not on last step (signup is filtered by showNavigation) */}
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
                {t('onboarding.next')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Pagination dot component
function PaginationDot({
  isActive,
  isPast,
  colors,
}: {
  isActive: boolean;
  isPast: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 24 : 8, { duration: 200 }),
    backgroundColor: withTiming(
      isActive ? colors.primary : isPast ? colors.primary + '60' : colors.muted,
      { duration: 200 }
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

// Helper to check if new onboarding is complete
export async function isNewOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Helper to get saved preferences
export async function getOnboardingPreferences(): Promise<{ tripTypes: TripType[] } | null> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_PREFERENCES_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

// Helper to reset onboarding (for testing)
export async function resetNewOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, ONBOARDING_PREFERENCES_KEY]);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  navigationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  backButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  nextButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
