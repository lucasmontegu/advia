// apps/platform/src/app/api/subscription/portal/route.ts
import { polarClient } from "@driwet/auth/lib/payments";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session-helper";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mobileToken = searchParams.get("token");

  try {
    const { session, isMobile } = await getSessionFromRequest(mobileToken);

    if (!session?.user?.email) {
      // If from mobile, return error instead of redirect
      if (isMobile) {
        return NextResponse.json(
          { error: "Session expired. Please sign in again." },
          { status: 401 }
        );
      }
      // Redirect to login for web users
      return NextResponse.redirect(new URL("/login?redirect=/api/subscription/portal", request.url));
    }

    // Find customer by email
    const customers = await polarClient.customers.list({
      query: session.user.email,
      limit: 1,
    });

    const customer = customers.result.items[0];

    if (!customer) {
      // No subscription history - redirect to checkout
      // Preserve token for mobile users
      const checkoutUrl = mobileToken
        ? `/api/subscription/checkout?plan=monthly&token=${encodeURIComponent(mobileToken)}`
        : "/api/subscription/checkout?plan=monthly";
      return NextResponse.redirect(new URL(checkoutUrl, request.url));
    }

    // Create customer session for portal access
    const customerSession = await polarClient.customerSessions.create({
      customerId: customer.id,
    });

    // Redirect to Polar customer portal
    return NextResponse.redirect(customerSession.customerPortalUrl);
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
