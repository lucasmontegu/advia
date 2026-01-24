// apps/mobile/components/onboarding/new-onboarding-flow.tsx
import { useState, useCallback, useEffect } from 'react';
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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  SlideInRight,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { Icon } from '@/components/icons';
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
  const showProgressBar = currentStep !== 'hook';

  // Animated progress value
  const progressValue = useSharedValue(0);
  const progressGlow = useSharedValue(0.5);

  // Update progress animation when step changes
  useEffect(() => {
    // Progress is 0-100 based on steps (excluding hook screen)
    const totalSteps = STEPS.length - 1; // Exclude hook
    const currentProgress = currentStep === 'hook' ? 0 : ((currentIndex) / totalSteps) * 100;
    progressValue.value = withSpring(currentProgress, { damping: 15, stiffness: 100 });

    // Pulse glow when progress changes
    progressGlow.value = withTiming(1, { duration: 300 }, () => {
      progressGlow.value = withTiming(0.5, { duration: 500 });
    });
  }, [currentStep, currentIndex]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const progressGlowStyle = useAnimatedStyle(() => ({
    opacity: progressGlow.value,
  }));

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

      {/* Animated Progress Bar - shows on all screens except hook */}
      {showProgressBar && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.progressContainer, { paddingTop: insets.top + 8 }]}
          pointerEvents="none"
        >
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <Animated.View style={[styles.progressFill, progressStyle]}>
              <LinearGradient
                colors={[colors.primary, '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Glow effect at the end */}
              <Animated.View style={[styles.progressGlow, { backgroundColor: colors.primary }, progressGlowStyle]} />
            </Animated.View>
          </View>

          {/* Step indicators */}
          <View style={styles.stepIndicators}>
            {STEPS.slice(1).map((step, index) => {
              const stepIndex = index + 1;
              const isCompleted = stepIndex < currentIndex;
              const isCurrent = stepIndex === currentIndex;

              return (
                <View key={step} style={styles.stepIndicator}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: isCompleted
                          ? colors.primary
                          : isCurrent
                          ? colors.primary + '50'
                          : colors.muted,
                        borderColor: isCurrent ? colors.primary : 'transparent',
                        borderWidth: isCurrent ? 2 : 0,
                      },
                    ]}
                  >
                    {isCompleted && (
                      <Icon name="check" size={10} color={colors.primaryForeground} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isCompleted || isCurrent ? colors.foreground : colors.mutedForeground,
                        fontFamily: isCurrent ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      },
                    ]}
                  >
                    {getStepLabel(step, t)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Navigation overlay (skip, next) */}
      {showNavigation && (
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[
            styles.navigationOverlay,
            { paddingBottom: insets.bottom + 24 },
          ]}
          pointerEvents="box-none"
        >
          {/* Top bar with back/skip */}
          <View style={[styles.topBar, { paddingTop: insets.top + 80 }]}>
            {canGoBack ? (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <View style={[styles.backButtonInner, { backgroundColor: colors.muted }]}>
                  <Icon name="close" size={16} color={colors.mutedForeground} />
                </View>
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

          {/* Bottom bar with next button */}
          <View style={styles.bottomBar}>
            {/* Progress text */}
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              Step {currentIndex} of {STEPS.length - 1}
            </Text>

            {/* Next button with arrow */}
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButton}
              >
                <Text style={[styles.nextButtonText, { color: colors.primaryForeground }]}>
                  {t('onboarding.next')}
                </Text>
                <Text style={[styles.nextButtonArrow, { color: colors.primaryForeground }]}>
                  →
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Helper to get step labels
function getStepLabel(step: OnboardingStep, t: (key: string) => string): string {
  const labels: Record<OnboardingStep, string> = {
    hook: '',
    promise: 'Welcome',
    personalization: 'Customize',
    demo: 'Preview',
    signup: 'Start',
  };
  return labels[step];
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
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute',
    right: 0,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  navigationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  backButton: {
    minWidth: 40,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  progressText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  nextButtonArrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
});
