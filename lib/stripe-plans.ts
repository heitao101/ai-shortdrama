export type PlanId = "credits_100" | "credits_500" | "pro_monthly";

export type PlanType = "payment" | "subscription";

export type StripePlan = {
  id: PlanId;
  type: PlanType;
  credits: number;
  /** Amount in smallest currency unit (e.g. cents) */
  amount: number;
  currency: string;
  /** Optional Stripe Price ID from Dashboard */
  priceIdEnvKey: string;
  popular?: boolean;
};

/** 100 credits $5 · 500 credits $20 · Pro $9.9/mo */
export const STRIPE_PLANS: Record<PlanId, StripePlan> = {
  credits_100: {
    id: "credits_100",
    type: "payment",
    credits: 100,
    amount: 500,
    currency: "usd",
    priceIdEnvKey: "STRIPE_PRICE_CREDITS_100",
  },
  credits_500: {
    id: "credits_500",
    type: "payment",
    credits: 500,
    amount: 2000,
    currency: "usd",
    popular: true,
    priceIdEnvKey: "STRIPE_PRICE_CREDITS_500",
  },
  pro_monthly: {
    id: "pro_monthly",
    type: "subscription",
    credits: 300,
    amount: 990,
    currency: "usd",
    priceIdEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
};

export function getPlan(planId: string): StripePlan | undefined {
  return STRIPE_PLANS[planId as PlanId];
}

export function getPriceId(plan: StripePlan): string | undefined {
  const id = process.env[plan.priceIdEnvKey];
  return id && id.length > 0 ? id : undefined;
}
