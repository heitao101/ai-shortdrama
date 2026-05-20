import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, getAppUrl, isStripeConfigured } from "@/lib/stripe";
import { getPlan, getPriceId, type PlanId } from "@/lib/stripe-plans";

export const runtime = "nodejs";

type Body = {
  planId: PlanId;
  locale?: string;
};

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const plan = getPlan(body.planId);

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const locale = body.locale ?? "zh-HK";
    const stripe = getStripe();
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
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[create-checkout-session]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
