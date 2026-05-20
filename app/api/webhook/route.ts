import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getPlan, type PlanId } from "@/lib/stripe-plans";
import { fulfillPlanForUser, setUserProStatus } from "@/lib/credits";

export const runtime = "nodejs";

function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = (
    invoice as Stripe.Invoice & {
      subscription?: string | { id: string } | null;
    }
  ).subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.userId ?? session.client_reference_id ?? null;
  const planId = session.metadata?.planId as PlanId | undefined;

  if (!userId || !planId) {
    console.warn("[stripe-webhook] Missing userId or planId", {
      sessionId: session.id,
    });
    return;
  }

  if (!getPlan(planId)) {
    console.warn("[stripe-webhook] Unknown planId", planId);
    return;
  }

  const paid =
    session.payment_status === "paid" ||
    session.status === "complete" ||
    session.mode === "subscription";

  if (!paid) {
    console.info("[stripe-webhook] Session not paid yet, skipping", session.id);
    return;
  }

  const result = await fulfillPlanForUser(
    userId,
    planId,
    `checkout:${session.id}`
  );

  if (result) {
    console.info(
      `[stripe-webhook] Fulfilled ${planId} for ${userId} → ${result.credits} credits, isPro=${result.isPro}`
    );
  }
}

async function fulfillSubscriptionRenewal(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle") {
    return;
  }

  const subscriptionId = getSubscriptionId(invoice);
  if (!subscriptionId) {
    console.warn("[stripe-webhook] Invoice missing subscription", invoice.id);
    return;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId as PlanId | undefined;

  if (!userId || !planId) {
    console.warn(
      "[stripe-webhook] Subscription missing metadata",
      subscriptionId
    );
    return;
  }

  const plan = getPlan(planId);
  if (!plan || plan.type !== "subscription") {
    return;
  }

  const result = await fulfillPlanForUser(
    userId,
    planId,
    `invoice:${invoice.id}`
  );

  if (result) {
    console.info(
      `[stripe-webhook] Renewal ${planId} for ${userId} → ${result.credits} credits`
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await setUserProStatus(userId, false);
  console.info(`[stripe-webhook] Pro deactivated for ${userId}`);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await fulfillCheckout(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "invoice.payment_succeeded": {
        await fulfillSubscriptionRenewal(event.data.object as Stripe.Invoice);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe-webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
