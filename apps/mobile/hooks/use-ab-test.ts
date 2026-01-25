// apps/mobile/hooks/use-ab-test.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
	getFeatureFlag,
	reloadFeatureFlags,
	trackEvent,
} from "@/lib/analytics";

// ============ A/B Test Configuration ============

/**
 * A/B Test definitions from design doc Part 8
 * Each test has a key, variants, and target metric
 */
export const AB_TESTS = {
	// Onboarding hook: Dramatic stats vs Calm intro
	ONBOARDING_HOOK: {
		key: "onboarding_hook_variant",
		variants: ["dramatic", "calm"] as const,
		metric: "onboarding_completion_rate",
	},
	// Demo route: Interactive vs Video
	DEMO_ROUTE: {
		key: "demo_route_variant",
		variants: ["interactive", "video"] as const,
		metric: "demo_time_spent",
	},
	// Paywall timing: After 1st route vs After 3rd
	PAYWALL_TIMING: {
		key: "paywall_timing_variant",
		variants: ["after_first", "after_third"] as const,
		metric: "trial_start_rate",
	},
	// Safe stop sampling: Show once free vs Hard gate
	SAFE_STOP_SAMPLING: {
		key: "safe_stop_sampling_variant",
		variants: ["show_once", "hard_gate"] as const,
		metric: "conversion_rate",
	},
	// Voice upsell: After route vs On mic tap
	VOICE_UPSELL: {
		key: "voice_upsell_variant",
		variants: ["after_route", "on_mic_tap"] as const,
		metric: "trial_start_rate",
	},
	// Pricing display: Local currency vs USD
	PRICING_DISPLAY: {
		key: "pricing_display_variant",
		variants: ["local_currency", "usd"] as const,
		metric: "conversion_rate",
	},
} as const;

export type ABTestKey = keyof typeof AB_TESTS;
export type ABTestVariant<K extends ABTestKey> =
	(typeof AB_TESTS)[K]["variants"][number];

// Storage key for local variant overrides (for testing)
const AB_TEST_OVERRIDE_KEY = "@driwet/ab-test-overrides";

// ============ Hook ============

interface UseABTestOptions<K extends ABTestKey> {
	testKey: K;
	trackExposure?: boolean;
}

interface UseABTestReturn<K extends ABTestKey> {
	variant: ABTestVariant<K> | null;
	isLoading: boolean;
	isVariant: (v: ABTestVariant<K>) => boolean;
}

/**
 * Hook for A/B testing using PostHog feature flags
 *
 * @example
 * const { variant, isVariant } = useABTest({ testKey: "ONBOARDING_HOOK" });
 *
 * if (isVariant("dramatic")) {
 *   return <DramaticHookScreen />;
 * } else {
 *   return <CalmHookScreen />;
 * }
 */
export function useABTest<K extends ABTestKey>({
	testKey,
	trackExposure = true,
}: UseABTestOptions<K>): UseABTestReturn<K> {
	const [variant, setVariant] = useState<ABTestVariant<K> | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const testConfig = AB_TESTS[testKey];

	useEffect(() => {
		async function loadVariant() {
			try {
				// First check for local override (dev/testing)
				const overrides = await AsyncStorage.getItem(AB_TEST_OVERRIDE_KEY);
				if (overrides) {
					const parsed = JSON.parse(overrides);
					if (parsed[testConfig.key]) {
						setVariant(parsed[testConfig.key] as ABTestVariant<K>);
						setIsLoading(false);
						return;
					}
				}

				// Load from PostHog feature flags
				await reloadFeatureFlags();
				const flagValue = await getFeatureFlag(testConfig.key);

				if (flagValue && typeof flagValue === "string") {
					const validVariant = testConfig.variants.find((v) => v === flagValue);
					if (validVariant) {
						setVariant(validVariant as ABTestVariant<K>);

						// Track exposure for experiment analysis
						if (trackExposure) {
							trackEvent("ab_test_exposure", {
								test_key: testKey,
								variant: validVariant,
								metric: testConfig.metric,
							});
						}
					} else {
						// Default to first variant if invalid value
						setVariant(testConfig.variants[0] as ABTestVariant<K>);
					}
				} else {
					// Default to first variant if no flag set
					setVariant(testConfig.variants[0] as ABTestVariant<K>);
				}
			} catch (error) {
				console.warn("Failed to load A/B test variant:", error);
				// Default to first variant on error
				setVariant(testConfig.variants[0] as ABTestVariant<K>);
			} finally {
				setIsLoading(false);
			}
		}

		loadVariant();
	}, [testKey, testConfig, trackExposure]);

	const isVariant = useCallback(
		(v: ABTestVariant<K>): boolean => {
			return variant === v;
		},
		[variant],
	);

	return {
		variant,
		isLoading,
		isVariant,
	};
}

// ============ Utility Functions ============

/**
 * Set a local override for an A/B test (for development/testing)
 */
export async function setABTestOverride<K extends ABTestKey>(
	testKey: K,
	variant: ABTestVariant<K>,
): Promise<void> {
	const testConfig = AB_TESTS[testKey];
	const overrides = await AsyncStorage.getItem(AB_TEST_OVERRIDE_KEY);
	const parsed = overrides ? JSON.parse(overrides) : {};
	parsed[testConfig.key] = variant;
	await AsyncStorage.setItem(AB_TEST_OVERRIDE_KEY, JSON.stringify(parsed));
}

/**
 * Clear all local A/B test overrides
 */
export async function clearABTestOverrides(): Promise<void> {
	await AsyncStorage.removeItem(AB_TEST_OVERRIDE_KEY);
}

/**
 * Track a conversion event for an A/B test
 */
export function trackABTestConversion<K extends ABTestKey>(
	testKey: K,
	variant: ABTestVariant<K>,
	conversionValue?: number,
): void {
	const testConfig = AB_TESTS[testKey];
	trackEvent("ab_test_conversion", {
		test_key: testKey,
		variant,
		metric: testConfig.metric,
		conversion_value: conversionValue ?? 1,
	});
}

// ============ Convenience Hooks ============

/**
 * Hook for onboarding hook variant (dramatic vs calm)
 */
export function useOnboardingHookVariant() {
	return useABTest({ testKey: "ONBOARDING_HOOK" });
}

/**
 * Hook for demo route variant (interactive vs video)
 */
export function useDemoRouteVariant() {
	return useABTest({ testKey: "DEMO_ROUTE" });
}

/**
 * Hook for paywall timing variant
 */
export function usePaywallTimingVariant() {
	return useABTest({ testKey: "PAYWALL_TIMING" });
}

/**
 * Hook for safe stop sampling variant
 */
export function useSafeStopSamplingVariant() {
	return useABTest({ testKey: "SAFE_STOP_SAMPLING" });
}

/**
 * Hook for voice upsell variant
 */
export function useVoiceUpsellVariant() {
	return useABTest({ testKey: "VOICE_UPSELL" });
}

/**
 * Hook for pricing display variant
 */
export function usePricingDisplayVariant() {
	return useABTest({ testKey: "PRICING_DISPLAY" });
}
