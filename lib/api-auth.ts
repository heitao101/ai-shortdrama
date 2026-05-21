import { NextRequest } from "next/server";
import { auth, getAuth } from "@clerk/nextjs/server";

const AUTH_TOKEN_TYPES = ["session_token", "oauth_token"] as const;

export type ResolvedAuth = {
  userId: string | null;
  sessionId: string | null;
  source: string;
};

export async function resolveRequestAuth(
  request: NextRequest
): Promise<ResolvedAuth> {
  try {
    const fromRequest = getAuth(request, {
      acceptsToken: [...AUTH_TOKEN_TYPES],
    });
    if (fromRequest.userId) {
      return {
        userId: fromRequest.userId,
        sessionId: fromRequest.sessionId,
        source: "getAuth(request)",
      };
    }
  } catch {
    /* fall through */
  }

  try {
    const fromAuth = await auth({
      acceptsToken: [...AUTH_TOKEN_TYPES],
    });

    const authUserId =
      fromAuth.isAuthenticated && "userId" in fromAuth
        ? fromAuth.userId
        : null;
    const authSessionId =
      fromAuth.isAuthenticated && "sessionId" in fromAuth
        ? fromAuth.sessionId
        : null;

    if (authUserId) {
      return {
        userId: authUserId,
        sessionId: authSessionId ?? null,
        source: "auth()",
      };
    }
  } catch {
    /* fall through */
  }

  return { userId: null, sessionId: null, source: "none" };
}
