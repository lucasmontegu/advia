// apps/platform/src/app/api/webhooks/revenuecat/route.ts
// RevenueCat Webhook handler for subscription events
// Docs: https://www.revenuecat.com/docs/integrations/webhooks

import { db, eq } from "@driwet/db";
import { users } from "@driwet/db/schema/auth";
import { env } from "@driwet/env/server";
import { type NextRequest, NextResponse } from "next/server";

// RevenueCat webhook event types
type RevenueCatEventType =
	| "INITIAL_PURCHASE"
	| "RENEWAL"
	| "CANCELLATION"
	| "UNCANCELLATION"
	| "NON_RENEWING_PURCHASE"
	| "SUBSCRIPTION_PAUSED"
	| "EXPIRATION"
	| "BILLING_ISSUE"
	| "PRODUCT_CHANGE"
	| "TRANSFER";

interface RevenueCatWebhookEvent {
	api_version: string;
	event: {
		type: RevenueCatEventType;
		id: string;
		app_id: string;
		app_user_id: string; // This is our user ID from Better Auth
		original_app_user_id: string;
		product_id: string;
		entitlement_ids: string[];
		expiration_at_ms: number | null;
		purchased_at_ms: number;
		store:
			| "APP_STORE"
			| "PLAY_STORE"
			| "STRIPE"
			| "MAC_APP_STORE"
			| "PROMOTIONAL";
		environment: "PRODUCTION" | "SANDBOX";
		subscriber_attributes?: Record<
			string,
			{ value: string; updated_at_ms: number }
		>;
		period_type?: "NORMAL" | "TRIAL" | "INTRO" | "PROMOTIONAL";
		cancel_reason?: string;
		grace_period_expiration_at_ms?: number;
	};
}

// Map RevenueCat event types to subscription status
function getSubscriptionStatus(
	eventType: RevenueCatEventType,
	gracePeriodExpiration?: number,
): string | null {
	switch (eventType) {
		case "INITIAL_PURCHASE":
		case "RENEWAL":
		case "UNCANCELLATION":
		case "NON_RENEWING_PURCHASE":
			return "active";
		case "CANCELLATION":
			return "cancelled"; // Still has access until expiration
		case "EXPIRATION":
			return "expired";
		case "BILLING_ISSUE":
			return gracePeriodExpiration ? "grace_period" : "billing_issue";
		case "SUBSCRIPTION_PAUSED":
			return "paused";
		case "PRODUCT_CHANGE":
			return "active"; // Product changed but still active
		case "TRANSFER":
			return null; // Handle separately
		default:
			return null;
	}
}

// Determine if user should have premium access
function shouldHavePremiumAccess(
	eventType: RevenueCatEventType,
	expirationAtMs: number | null,
): boolean {
	const now = Date.now();

	switch (eventType) {
		case "INITIAL_PURCHASE":
		case "RENEWAL":
		case "UNCANCELLATION":
		case "NON_RENEWING_PURCHASE":
		case "PRODUCT_CHANGE":
			return true;
		case "CANCELLATION":
			// Still has access until expiration
			return expirationAtMs ? expirationAtMs > now : true;
		case "BILLING_ISSUE":
			// May still have access during grace period
			return expirationAtMs ? expirationAtMs > now : false;
		case "EXPIRATION":
		case "SUBSCRIPTION_PAUSED":
			return false;
		case "TRANSFER":
			return false; // Will be handled by the receiving user
		default:
			return false;
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verify webhook authorization (optional but recommended)
		const authHeader = request.headers.get("Authorization");
		if (env.REVENUECAT_WEBHOOK_SECRET) {
			if (authHeader !== `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`) {
				console.error("[RevenueCat Webhook] Invalid authorization");
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
		}

		const body = (await request.json()) as RevenueCatWebhookEvent;
		const { event } = body;

		console.log(
			`[RevenueCat Webhook] Received event: ${event.type} for user: ${event.app_user_id}`,
		);

		// Skip sandbox events in production (optional)
		// if (env.NODE_ENV === "production" && event.environment === "SANDBOX") {
		// 	console.log("[RevenueCat Webhook] Skipping sandbox event in production");
		// 	return NextResponse.json({ success: true, skipped: true });
		// }

		// Get the user ID - RevenueCat sends our app_user_id which is the Better Auth user ID
		const userId = event.app_user_id;

		// Skip anonymous users (those starting with $RCAnonymousID:)
		if (userId.startsWith("$RCAnonymousID:")) {
			console.log("[RevenueCat Webhook] Skipping anonymous user");
			return NextResponse.json({ success: true, skipped: true });
		}

		// Calculate subscription status
		const subscriptionStatus = getSubscriptionStatus(
			event.type,
			event.grace_period_expiration_at_ms,
		);
		const isPremium = shouldHavePremiumAccess(
			event.type,
			event.expiration_at_ms,
		);
		const expirationDate = event.expiration_at_ms
			? new Date(event.expiration_at_ms)
			: null;

		// Update user in database
		const updateResult = await db
			.update(users)
			.set({
				isPremium,
				subscriptionStatus,
				subscriptionProductId: event.product_id,
				subscriptionExpiresAt: expirationDate,
				revenuecatCustomerId: event.original_app_user_id,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))
			.returning({ id: users.id });

		if (updateResult.length === 0) {
			console.error(`[RevenueCat Webhook] User not found: ${userId}`);
			// Return 200 to prevent RevenueCat from retrying (user might not exist yet)
			return NextResponse.json({
				success: false,
				error: "User not found",
			});
		}

		console.log(
			`[RevenueCat Webhook] Updated user ${userId}: isPremium=${isPremium}, status=${subscriptionStatus}`,
		);

		return NextResponse.json({
			success: true,
			userId,
			isPremium,
			subscriptionStatus,
		});
	} catch (error) {
		console.error("[RevenueCat Webhook] Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// RevenueCat may send GET requests for webhook verification
export async function GET() {
	return NextResponse.json({
		status: "ok",
		service: "RevenueCat Webhook",
		timestamp: new Date().toISOString(),
	});
}
