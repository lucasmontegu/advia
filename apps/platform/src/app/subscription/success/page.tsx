// apps/platform/src/app/subscription/success/page.tsx
// This page handles payment success redirects and redirects to the mobile app deep link
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function SuccessRedirect() {
	const searchParams = useSearchParams();
	const checkoutId = searchParams.get("checkout_id");

	useEffect(() => {
		// Construct the deep link URL
		const deepLinkUrl = checkoutId
			? `driwet://subscription/success?checkout_id=${checkoutId}`
			: "driwet://subscription/success";

		// Redirect to the mobile app via deep link
		window.location.href = deepLinkUrl;
	}, [checkoutId]);

	return null;
}

export default function SubscriptionSuccessPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
			<Suspense fallback={null}>
				<SuccessRedirect />
			</Suspense>
			<div className="animate-pulse">
				<h1 className="mb-4 font-bold text-2xl text-foreground">
					Payment Successful!
				</h1>
				<p className="text-muted-foreground">
					Redirecting you back to the app...
				</p>
			</div>
		</div>
	);
}
