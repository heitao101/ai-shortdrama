import { createClerkClient } from "@clerk/backend";
import { getPlan, type PlanId } from "@/lib/stripe-plans";
import {
  parseCreditsMetadata,
  getProcessedStripeEvents,
  CREDITS_METADATA_KEY,
  IS_PRO_METADATA_KEY,
  PROCESSED_STRIPE_EVENTS_KEY,
  type UserCreditsMeta,
} from "@/lib/credits-meta";

export {
  CREDITS_METADATA_KEY,
  IS_PRO_METADATA_KEY,
  PROCESSED_STRIPE_EVENTS_KEY,
  parseCreditsMetadata,
  getProcessedStripeEvents,
  type UserCreditsMeta,
} from "@/lib/credits-meta";

const MAX_PROCESSED_EVENTS = 200;

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not set");
  }
  return createClerkClient({ secretKey });
}

export async function getUserCredits(userId: string): Promise<UserCreditsMeta> {
  const clerk = getClerk();
  const user = await clerk.users.getUser(userId);
  return parseCreditsMetadata(user.publicMetadata as Record<string, unknown>);
}

/**
 * Returns true if this event was newly claimed (safe to fulfill).
 * Returns false if already processed (skip duplicate webhook delivery).
 */
export async function claimStripeEvent(
  userId: string,
  eventKey: string
): Promise<boolean> {
  const clerk = getClerk();
  const user = await clerk.users.getUser(userId);
  const processed = getProcessedStripeEvents(
    user.privateMetadata as Record<string, unknown>
  );

  if (processed.includes(eventKey)) {
    return false;
  }

  const next = [...processed, eventKey].slice(-MAX_PROCESSED_EVENTS);

  await clerk.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...(user.privateMetadata ?? {}),
      [PROCESSED_STRIPE_EVENTS_KEY]: next,
    },
  });

  return true;
}

export async function addUserCredits(
  userId: string,
  amount: number
): Promise<UserCreditsMeta> {
  const clerk = getClerk();
  const current = await getUserCredits(userId);
  const nextCredits = Math.max(0, current.credits + amount);
  const user = await clerk.users.getUser(userId);

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...(user.publicMetadata ?? {}),
      [CREDITS_METADATA_KEY]: nextCredits,
    },
  });

  return { credits: nextCredits, isPro: current.isPro };
}

export async function setUserProStatus(
  userId: string,
  isPro: boolean,
  bonusCredits = 0
): Promise<UserCreditsMeta> {
  const clerk = getClerk();
  const current = await getUserCredits(userId);
  const nextCredits = current.credits + bonusCredits;
  const user = await clerk.users.getUser(userId);

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...(user.publicMetadata ?? {}),
      [CREDITS_METADATA_KEY]: nextCredits,
      [IS_PRO_METADATA_KEY]: isPro,
    },
  });

  return { credits: nextCredits, isPro };
}

/** Apply plan credits / Pro status after a successful Stripe payment */
export async function fulfillPlanForUser(
  userId: string,
  planId: PlanId,
  eventKey: string
): Promise<UserCreditsMeta | null> {
  const plan = getPlan(planId);
  if (!plan) {
    console.warn("[credits] Unknown planId:", planId);
    return null;
  }

  const claimed = await claimStripeEvent(userId, eventKey);
  if (!claimed) {
    console.info("[credits] Skipping duplicate event:", eventKey);
    return null;
  }

  if (plan.type === "subscription") {
    return setUserProStatus(userId, true, plan.credits);
  }

  return addUserCredits(userId, plan.credits);
}
