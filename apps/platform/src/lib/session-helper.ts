// apps/platform/src/lib/session-helper.ts
import { auth } from "@driwet/auth";
import { headers } from "next/headers";

export interface SessionResult {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  isMobile: boolean;
}

/**
 * Get session from either mobile token or web cookies
 * Handles both authentication methods in a unified way
 *
 * Better Auth validates sessions using cookies, so for mobile tokens
 * we need to pass them as a cookie header, not a Bearer token.
 */
export async function getSessionFromRequest(
  mobileToken: string | null
): Promise<SessionResult> {
  let session;
  const isMobile = !!mobileToken;

  if (mobileToken) {
    // Validate the session token from mobile app
    // Better Auth expects the token as a cookie, not a Bearer token
    session = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${mobileToken}`,
      }),
    });
  } else {
    // Fall back to cookie-based session for web
    session = await auth.api.getSession({
      headers: await headers(),
    });
  }

  return { session, isMobile };
}
