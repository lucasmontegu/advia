// apps/mobile/app/(auth)/onboarding.tsx
import { useRouter } from "expo-router";
import { NewOnboardingFlow } from "@/components/onboarding";

export default function OnboardingScreen() {
	const router = useRouter();

	const handleComplete = () => {
		// After onboarding as guest, go to main app
		router.replace("/(app)/(tabs)");
	};

	const handleCreateAccount = () => {
		// Go to sign in/sign up flow
		router.replace("/(auth)/sign-in");
	};

	return (
		<NewOnboardingFlow
			onComplete={handleComplete}
			onCreateAccount={handleCreateAccount}
		/>
	);
}
