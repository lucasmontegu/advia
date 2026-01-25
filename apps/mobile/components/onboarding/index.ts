// apps/mobile/components/onboarding/index.ts

export { DemoScreen } from "./demo-screen";
export { HookScreen } from "./hook-screen";

// New v2 onboarding flow (AI Co-Pilot as Safety Guardian)
export {
	getOnboardingPreferences,
	isNewOnboardingComplete,
	NewOnboardingFlow,
	resetNewOnboarding,
} from "./new-onboarding-flow";
// Legacy onboarding (kept for reference)
export {
	isOnboardingComplete,
	OnboardingScreen,
	resetOnboarding,
} from "./onboarding-screen";
export { OnboardingSlide, type OnboardingSlideData } from "./onboarding-slide";
export { PersonalizationScreen, type TripType } from "./personalization-screen";
export { PromiseScreen } from "./promise-screen";
export { SignupScreen } from "./signup-screen";
