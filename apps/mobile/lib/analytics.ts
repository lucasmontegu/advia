// apps/mobile/lib/analytics.ts

import { env } from "@driwet/env/mobile";
import PostHog from "posthog-react-native";

// PostHog client singleton
let posthogClient: PostHog | null = null;

export function getPostHog(): PostHog | null {
	return posthogClient;
}

export async function initAnalytics(): Promise<void> {
	// Skip if no API key configured
	if (!env.EXPO_PUBLIC_POSTHOG_KEY) {
		console.log("PostHog: No API key configured, analytics disabled");
		return;
	}

	try {
		posthogClient = new PostHog(env.EXPO_PUBLIC_POSTHOG_KEY, {
			host: env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
		});
	} catch (error) {
		console.error("PostHog init error:", error);
	}
}

// ============ Track Events ============

export function trackEvent(
	event: string,
	properties?: { [key: string]: string | number | boolean | null },
): void {
	posthogClient?.capture(event, properties);
}

export function identifyUser(
	userId: string,
	properties?: { [key: string]: string | number | boolean | null },
): void {
	posthogClient?.identify(userId, properties);
}

export function resetUser(): void {
	posthogClient?.reset();
}

// ============ Event Constants ============

export const EVENTS = {
	// Onboarding
	ONBOARDING_STARTED: "onboarding_started",
	ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
	ONBOARDING_SKIPPED: "onboarding_skipped",
	ONBOARDING_COMPLETED: "onboarding_completed",

	// Activation
	FIRST_ROUTE_PLANNED: "first_route_planned",
	FIRST_ROUTE_COMPLETED: "first_route_completed",

	// Engagement
	AI_CHAT_OPENED: "ai_chat_opened",
	AI_MESSAGE_SENT: "ai_message_sent",
	VOICE_INPUT_USED: "voice_input_used",
	VOICE_OUTPUT_PLAYED: "voice_output_played",
	SAFE_STOP_VIEWED: "safe_stop_viewed",
	SAFE_STOP_ADDED: "safe_stop_added",
	WEATHER_SEGMENT_TAPPED: "weather_segment_tapped",

	// Conversion
	PAYWALL_VIEWED: "paywall_viewed",
	PAYWALL_DISMISSED: "paywall_dismissed",
	TRIAL_STARTED: "trial_started",
	SUBSCRIPTION_STARTED: "subscription_started",
	SUBSCRIPTION_CANCELLED: "subscription_cancelled",

	// Feature Gates
	PREMIUM_FEATURE_BLOCKED: "premium_feature_blocked",
	PREMIUM_FEATURE_SAMPLED: "premium_feature_sampled",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

// ============ Predefined Events ============

export const Analytics = {
	// Auth events
	signUp: (method: "google" | "apple" | "email") => {
		trackEvent("user_signed_up", { method });
	},
	signIn: (method: "google" | "apple" | "email") => {
		trackEvent("user_signed_in", { method });
	},
	signOut: () => {
		trackEvent("user_signed_out");
		resetUser();
	},

	// ============ Onboarding Funnel ============
	onboardingStarted: () => {
		trackEvent(EVENTS.ONBOARDING_STARTED);
	},
	onboardingStepCompleted: (
		step: 1 | 2 | 3 | 4 | 5,
		stepName: "hook" | "promise" | "personalization" | "demo" | "signup",
	) => {
		trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, {
			step,
			step_name: stepName,
		});
	},
	onboardingSkipped: (atStep: number) => {
		trackEvent(EVENTS.ONBOARDING_SKIPPED, { at_step: atStep });
	},
	onboardingCompleted: (tripTypes: string[]) => {
		trackEvent(EVENTS.ONBOARDING_COMPLETED, {
			trip_types: tripTypes.join(","),
			trip_type_count: tripTypes.length,
		});
	},

	// ============ Activation ============
	firstRoutePlanned: (destination: string, distanceKm: number) => {
		trackEvent(EVENTS.FIRST_ROUTE_PLANNED, {
			destination,
			distance_km: distanceKm,
		});
	},
	firstRouteCompleted: (durationMinutes: number) => {
		trackEvent(EVENTS.FIRST_ROUTE_COMPLETED, {
			duration_minutes: durationMinutes,
		});
	},

	// ============ Route Events (existing, enhanced) ============
	routeCreated: (hasWeatherAlert: boolean, segmentCount?: number) => {
		trackEvent("route_created", {
			has_weather_alert: hasWeatherAlert,
			segment_count: segmentCount ?? null,
		});
	},
	routeStarted: (routeId: string) => {
		trackEvent("route_started", { route_id: routeId });
	},
	routeCompleted: (
		routeId: string,
		durationMinutes: number,
		alertsEncountered?: number,
	) => {
		trackEvent("route_completed", {
			route_id: routeId,
			duration_minutes: durationMinutes,
			alerts_encountered: alertsEncountered ?? 0,
		});
	},

	// ============ Weather Events ============
	weatherAlertViewed: (severity: string, alertType: string) => {
		trackEvent("weather_alert_viewed", { severity, alert_type: alertType });
	},
	weatherSegmentTapped: (
		segmentIndex: number,
		risk: "safe" | "caution" | "warning" | "danger",
	) => {
		trackEvent(EVENTS.WEATHER_SEGMENT_TAPPED, {
			segment_index: segmentIndex,
			risk,
		});
	},
	shelterSearched: (lat: number, lng: number) => {
		trackEvent("shelter_searched", { latitude: lat, longitude: lng });
	},
	shelterNavigated: (placeType: string) => {
		trackEvent("shelter_navigated", { place_type: placeType });
	},

	// ============ Safe Stops ============
	safeStopViewed: (
		stopId: string,
		amenities: string[],
		distanceFromAlert: number,
	) => {
		trackEvent(EVENTS.SAFE_STOP_VIEWED, {
			stop_id: stopId,
			amenities: amenities.join(","),
			distance_from_alert_km: distanceFromAlert,
		});
	},
	safeStopAdded: (stopId: string, stopType: string) => {
		trackEvent(EVENTS.SAFE_STOP_ADDED, {
			stop_id: stopId,
			stop_type: stopType,
		});
	},

	// ============ AI Chat Events ============
	aiChatOpened: (source: "button" | "long_press" | "notification") => {
		trackEvent(EVENTS.AI_CHAT_OPENED, { source });
	},
	aiMessageSent: (messageLength: number, hasRouteContext: boolean) => {
		trackEvent(EVENTS.AI_MESSAGE_SENT, {
			message_length: messageLength,
			has_route_context: hasRouteContext,
		});
	},
	chatMessageSent: () => {
		trackEvent("chat_message_sent");
	},
	chatQuickActionUsed: (action: string) => {
		trackEvent("chat_quick_action_used", { action });
	},

	// ============ Voice Events ============
	voiceInputUsed: (durationSeconds: number, transcriptionSuccess: boolean) => {
		trackEvent(EVENTS.VOICE_INPUT_USED, {
			duration_seconds: durationSeconds,
			transcription_success: transcriptionSuccess,
		});
	},
	voiceOutputPlayed: (
		textLength: number,
		voiceType: "standard" | "premium",
	) => {
		trackEvent(EVENTS.VOICE_OUTPUT_PLAYED, {
			text_length: textLength,
			voice_type: voiceType,
		});
	},

	// ============ Conversion Events ============
	paywallViewed: (
		source:
			| "voice_tap"
			| "safe_stop"
			| "settings"
			| "route_limit"
			| "post_route",
		variant?: string,
	) => {
		trackEvent(EVENTS.PAYWALL_VIEWED, {
			source,
			variant: variant ?? null,
		});
	},
	paywallDismissed: (source: string, timeSpentSeconds: number) => {
		trackEvent(EVENTS.PAYWALL_DISMISSED, {
			source,
			time_spent_seconds: timeSpentSeconds,
		});
	},
	trialStarted: (source: string) => {
		trackEvent(EVENTS.TRIAL_STARTED, { source });
	},
	subscriptionStarted: (
		plan: "monthly" | "yearly" | "lifetime",
		price: number,
		currency: string,
	) => {
		trackEvent(EVENTS.SUBSCRIPTION_STARTED, {
			plan,
			price,
			currency,
		});
	},
	subscriptionCancelled: (
		plan: string,
		daysSubscribed: number,
		reason?: string,
	) => {
		trackEvent(EVENTS.SUBSCRIPTION_CANCELLED, {
			plan,
			days_subscribed: daysSubscribed,
			reason: reason ?? null,
		});
	},

	// ============ Feature Gates ============
	premiumFeatureBlocked: (
		feature: "voice_input" | "voice_output" | "safe_stops" | "unlimited_routes",
	) => {
		trackEvent(EVENTS.PREMIUM_FEATURE_BLOCKED, { feature });
	},
	premiumFeatureSampled: (feature: string) => {
		trackEvent(EVENTS.PREMIUM_FEATURE_SAMPLED, { feature });
	},

	// ============ Feature Usage ============
	featureUsed: (feature: string) => {
		trackEvent("feature_used", { feature });
	},

	// ============ Errors ============
	errorOccurred: (
		error: string,
		context: string,
		severity?: "low" | "medium" | "high",
	) => {
		trackEvent("error_occurred", {
			error,
			context,
			severity: severity ?? "medium",
		});
	},
	errorBoundaryTriggered: (componentName: string, errorMessage: string) => {
		trackEvent("error_boundary_triggered", {
			component_name: componentName,
			error_message: errorMessage,
		});
	},
};

// ============ Conversion Funnel Helper ============

type FunnelStep =
	| "app_opened"
	| "onboarding_started"
	| "onboarding_completed"
	| "first_route_planned"
	| "first_route_completed"
	| "paywall_viewed"
	| "trial_started"
	| "subscription_started";

const FUNNEL_ORDER: FunnelStep[] = [
	"app_opened",
	"onboarding_started",
	"onboarding_completed",
	"first_route_planned",
	"first_route_completed",
	"paywall_viewed",
	"trial_started",
	"subscription_started",
];

export function trackFunnelStep(step: FunnelStep): void {
	const stepIndex = FUNNEL_ORDER.indexOf(step);
	trackEvent("conversion_funnel_step", {
		step,
		step_index: stepIndex,
		funnel: "main_conversion",
	});
}

// ============ User Properties ============

export function setUserProperties(properties: {
	tripTypes?: string[];
	isPremium?: boolean;
	trialDaysRemaining?: number;
	routesCompleted?: number;
	region?: string;
}): void {
	if (posthogClient) {
		posthogClient.identify(undefined, {
			trip_types: properties.tripTypes?.join(","),
			is_premium: properties.isPremium,
			trial_days_remaining: properties.trialDaysRemaining,
			routes_completed: properties.routesCompleted,
			region: properties.region,
		});
	}
}

// ============ Feature Flags (A/B Tests) ============

export async function getFeatureFlag(
	flagKey: string,
): Promise<boolean | string | undefined> {
	return posthogClient?.getFeatureFlag(flagKey);
}

export async function reloadFeatureFlags(): Promise<void> {
	await posthogClient?.reloadFeatureFlagsAsync();
}
