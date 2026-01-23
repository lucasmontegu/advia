// apps/platform/src/app/api/subscription/checkout/route.ts
import { auth } from "@driwet/auth";
import { polarClient } from "@driwet/auth/lib/payments";
import { env } from "@driwet/env/server";
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const plan = searchParams.get("plan") as "monthly" | "yearly";

  if (!plan || !["monthly", "yearly"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(
        new URL("/login?redirect=/api/subscription/checkout?plan=" + plan, request.url)
      );
    }

    // Create or get Polar customer
    let customerId: string | undefined;

    // Check if customer exists
    const existingCustomers = await polarClient.customers.list({
      query: session.user.email,
      limit: 1,
    });

    if (existingCustomers.result.items.length > 0) {
      customerId = existingCustomers.result.items[0]?.id;
    } else {
      // Create new customer
      const newCustomer = await polarClient.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = newCustomer.id;
    }

    // Get product ID based on plan
    const productId =
      plan === "monthly" ? env.POLAR_MONTHLY_PRODUCT_ID : env.POLAR_YEARLY_PRODUCT_ID;

    // Create checkout session
    const checkoutSession = await polarClient.checkouts.create({
      products: [productId],
      customerId,
      successUrl: "driwet://subscription/success",
      customerEmail: session.user.email,
      metadata: {
        userId: session.user.id,
        plan,
      },
    });

    // Redirect to Polar checkout
    return NextResponse.redirect(checkoutSession.url);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
