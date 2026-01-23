// apps/platform/src/app/api/subscription/portal/route.ts
import { auth } from "@driwet/auth";
import { polarClient } from "@driwet/auth/lib/payments";
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      // Redirect to login if not authenticated
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
      return NextResponse.redirect(new URL("/api/subscription/checkout?plan=monthly", request.url));
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
