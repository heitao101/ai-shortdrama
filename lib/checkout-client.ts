import type { PlanId } from "@/lib/stripe-plans";

export type CheckoutPlanType = "one-time" | "subscription";

export type CheckoutApiResponse = {
  ok?: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
  hint?: string;
};

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_SIGNED_IN" | "NO_TOKEN" | "API_ERROR" | "INVALID_RESPONSE"
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

type GetTokenFn = (options?: { skipCache?: boolean }) => Promise<string | null>;

async function parseCheckoutResponse(res: Response): Promise<CheckoutApiResponse> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as CheckoutApiResponse;
  }

  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new CheckoutError(
      res.status === 401
        ? "Please sign in before purchasing"
        : `Server returned HTML instead of JSON (${res.status})`,
      "INVALID_RESPONSE"
    );
  }

  try {
    return JSON.parse(text) as CheckoutApiResponse;
  } catch {
    throw new CheckoutError(
      `Unexpected response (${res.status})`,
      "INVALID_RESPONSE"
    );
  }
}

export async function getClerkSessionToken(
  getToken: GetTokenFn
): Promise<string> {
  let token = await getToken();

  if (!token) {
    token = await getToken({ skipCache: true });
  }

  if (!token) {
    throw new CheckoutError(
      "Unable to get session token. Please sign in again.",
      "NO_TOKEN"
    );
  }

  return token;
}

export async function createCheckoutSession(
  plan: PlanId,
  type: CheckoutPlanType,
  locale: string,
  getToken: GetTokenFn
): Promise<{ url: string; sessionId?: string }> {
  const token = await getClerkSessionToken(getToken);

  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan, type, locale }),
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseCheckoutResponse(res);

  if (!res.ok || data.ok === false || !data.url) {
    const message = [data.error, data.hint].filter(Boolean).join(" — ");
    throw new CheckoutError(
      message || `Checkout failed (${res.status})`,
      "API_ERROR"
    );
  }

  return { url: data.url, sessionId: data.sessionId };
}
