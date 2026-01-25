// apps/mobile/hooks/use-paywall.ts
import { useCallback, useEffect, useState } from "react";
import { useTrialStore } from "@/stores/trial-store";
import { useIsPremium } from "./use-subscription";

type UsePaywallOptions = {
	autoShowOnTrialExpiry?: boolean;
};

export function usePaywall(options: UsePaywallOptions = {}) {
	const { autoShowOnTrialExpiry = true } = options;
	const [isVisible, setIsVisible] = useState(false);
	const { trialStartDate, getRemainingDays, checkTrialStatus } =
		useTrialStore();
	const { isSubscribed, isPremium } = useIsPremium();

	// Check if trial has expired
	const isTrialExpired =
		trialStartDate && getRemainingDays() === 0 && !isSubscribed;

	// Auto-show paywall when trial expires
	useEffect(() => {
		if (autoShowOnTrialExpiry && isTrialExpired) {
			setIsVisible(true);
		}
	}, [autoShowOnTrialExpiry, isTrialExpired]);

	// Auto-dismiss when subscription is active
	useEffect(() => {
		if (isSubscribed) {
			setIsVisible(false);
		}
	}, [isSubscribed]);

	const show = useCallback(() => {
		setIsVisible(true);
	}, []);

	const dismiss = useCallback(() => {
		// Only allow dismiss if trial hasn't expired or user is premium
		if (!isTrialExpired || isPremium) {
			setIsVisible(false);
		}
	}, [isTrialExpired, isPremium]);

	const forceShow = useCallback(() => {
		setIsVisible(true);
	}, []);

	return {
		isVisible,
		show,
		dismiss,
		forceShow,
		isTrialExpired,
		canDismiss: !isTrialExpired || isPremium,
		checkTrialStatus,
	};
}
