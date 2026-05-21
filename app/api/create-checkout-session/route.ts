import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getPlan, getPriceId, type PlanId } from "@/lib/stripe-plans";

/** Isolated from next-intl — this route must always return JSON */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

const VALID_PLAN_IDS: PlanId[] = ["credits_100", "credits_500", "pro_monthly"];
const DEFAULT_LOCALE = "zh-HK";

type RequestBody = {
  planId?: string;
  locale?: string;
};

type JsonBody = Record<string, unknown>;

function logEnvPresence() {
  const status = {
    STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
    ),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    VERCEL_URL: Boolean(process.env.VERCEL_URL?.trim()),
    CLERK_SECRET_KEY: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
  };
  console.log("[create-checkout-session] env presence:", status);
  return status;
}

/** Always JSON — never rely on Next.js HTML error pages reaching the client */
function jsonResponse(body: JsonBody, status: number) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return jsonResponse({ ok: false, error: message, ...extra }, status);
}

function jsonOk(data: Record<string, unknown>) {
  return jsonResponse({ ok: true, ...data }, 200);
}

function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Missing Stripe key");
  }

  return new Stripe(secretKey, {
    typescript: true,
    maxNetworkRetries: 2,
    appInfo: {
      name: "DramaAI",
      version: "0.1.0",
    },
  });
}

function isValidPlanId(value: string | undefined): value is PlanId {
  return (
    typeof value === "string" &&
    (VALID_PLAN_IDS as string[]).includes(value)
  );
}

function resolveLocale(value: string | undefined): string {
  if (value === "zh-CN" || value === "zh-HK" || value === "en") {
    return value;
  }
  return DEFAULT_LOCALE;
}

async function parseBody(request: Request): Promise<RequestBody | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    const text = await request.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as RequestBody;
  } catch {
    return null;
  }
}

async function resolveUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error("[create-checkout-session] auth() failed:", error);
    return null;
  }
}

/** Health check — verify route returns JSON on Vercel (not HTML 404) */
export async function GET() {
  try {
    const env = logEnvPresence();
    return jsonOk({
      route: "/api/create-checkout-session",
      method: "GET",
      status: "alive",
      stripeConfigured: env.STRIPE_SECRET_KEY,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  const env = logEnvPresence();

  try {
    if (!env.STRIPE_SECRET_KEY) {
      console.error("[create-checkout-session] STRIPE_SECRET_KEY is missing");
      return jsonError("Missing Stripe key", 503);
    }

    const userId = await resolveUserId();
    if (!userId) {
      return jsonError("Unauthorized — please sign in", 401);
    }

    const body = await parseBody(request);
    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    if (!isValidPlanId(body.planId)) {
      return jsonError("Invalid plan", 400, { validPlans: VALID_PLAN_IDS });
    }

    const plan = getPlan(body.planId);
    if (!plan) {
      return jsonError("Plan not found", 400);
    }

    const locale = resolveLocale(body.locale);
    const stripe = createStripeClient();
    const appUrl = getAppUrl();
    const priceId = getPriceId(plan);

    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: plan.currency,
            unit_amount: plan.amount,
            product_data: {
              name:
                plan.type === "subscription"
                  ? "DramaAI Pro (Monthly)"
                  : `DramaAI Credits — ${plan.credits}`,
              description:
                plan.type === "subscription"
                  ? `${plan.credits} credits per month + Pro features`
                  : `${plan.credits} generation credits`,
            },
            ...(plan.type === "subscription"
              ? { recurring: { interval: "month" as const } }
              : {}),
          },
          quantity: 1,
        };

    const returnBase = `${appUrl}/${locale}`;

    console.log("[create-checkout-session] creating session", {
      userId,
      planId: plan.id,
      mode: plan.type === "subscription" ? "subscription" : "payment",
      appUrl: returnBase,
      usingPriceId: Boolean(priceId),
    });

    const session = await stripe.checkout.sessions.create({
      mode: plan.type === "subscription" ? "subscription" : "payment",
      client_reference_id: userId,
      line_items: [lineItem],
      success_url: `${returnBase}?checkout=success#pricing`,
      cancel_url: `${returnBase}?checkout=canceled#pricing`,
      metadata: {
        userId,
        planId: plan.id,
        credits: String(plan.credits),
        type: plan.type,
        amount: String(plan.amount),
        currency: plan.currency,
      },
      subscription_data:
        plan.type === "subscription"
          ? {
              metadata: {
                userId,
                planId: plan.id,
                credits: String(plan.credits),
              },
            }
          : undefined,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      console.error(
        "[create-checkout-session] Stripe session missing url",
        session.id
      );
      return jsonError("Failed to create checkout session", 500);
    }

    return jsonOk({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    console.error("[create-checkout-session] fatal:", message, error);

    if (message === "Missing Stripe key") {
      return jsonError("Missing Stripe key", 503);
    }

    if (error instanceof Stripe.errors.StripeError) {
      return jsonError(error.message || "Stripe API error", error.statusCode ?? 502);
    }

    return jsonError("Internal server error", 500, {
      detail:
        process.env.NODE_ENV === "development" ? message : undefined,
    });
  }
}
