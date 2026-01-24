// apps/mobile/components/onboarding/index.ts

// Legacy onboarding (kept for reference)
export { OnboardingScreen, isOnboardingComplete, resetOnboarding } from './onboarding-screen';
export { OnboardingSlide, type OnboardingSlideData } from './onboarding-slide';

// New v2 onboarding flow (AI Co-Pilot as Safety Guardian)
export {
  NewOnboardingFlow,
  isNewOnboardingComplete,
  getOnboardingPreferences,
  resetNewOnboarding,
} from './new-onboarding-flow';
export { HookScreen } from './hook-screen';
export { PromiseScreen } from './promise-screen';
export { PersonalizationScreen, type TripType } from './personalization-screen';
export { DemoScreen } from './demo-screen';
export { SignupScreen } from './signup-screen';
