import { auth } from "@driwet/auth";
import type { NextRequest } from "next/server";

export async function createContext(req: NextRequest) {
	const cookieHeader = req.headers.get("cookie");

	// If there are multiple session tokens (old browser cookie + new mobile cookie),
	// extract only the LAST one which is from the mobile app
	let cleanedHeaders = req.headers;

	if (cookieHeader) {
		// Find all session tokens
		const tokenMatches = cookieHeader.match(
			/better-auth\.session_token=[^;,]+/g,
		);

		if (tokenMatches && tokenMatches.length > 1) {
			// Multiple tokens found - use only the last one (mobile's token)
			const lastToken = tokenMatches[tokenMatches.length - 1];
			console.log(
				"[API Context] Multiple tokens found, using last:",
				lastToken?.substring(0, 50),
			);

			// Create new headers with only the last token
			const newHeaders = new Headers(req.headers);
			newHeaders.set("cookie", lastToken || "");
			cleanedHeaders = newHeaders;
		}
	}

	const session = await auth.api.getSession({
		headers: cleanedHeaders,
	});

	if (!session && process.env.NODE_ENV === "development") {
		console.log("[API Context] Session not found for cookie");
	}

	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
