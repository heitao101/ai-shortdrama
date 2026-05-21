export type PlanId =
  | "starter"
  | "personal-monthly"
  | "pro-creator"
  | "pro-monthly"
  | "team-pack"
  | "team-monthly"
  | "team-yearly";

export type PlanType = "payment" | "subscription";

export type BillingInterval = "once" | "month" | "year";

export type PlanCategory = "personal" | "professional" | "team";

export type PlanBadge = "popular" | "bestValue";

export type StripePlan = {
  id: PlanId;
  type: PlanType;
  category: PlanCategory;
  credits: number;
  /** Amount in smallest currency unit (cents) */
  amount: number;
  currency: string;
  billingInterval: BillingInterval;
  priceIdEnvKey: string;
  badge?: PlanBadge;
  /** Display hint e.g. monthly equivalent for yearly */
  priceNoteKey?: string;
};

export const STRIPE_PLANS: Record<PlanId, StripePlan> = {
  starter: {
    id: "starter",
    type: "payment",
    category: "personal",
    credits: 120,
    amount: 490,
    currency: "usd",
    billingInterval: "once",
    priceIdEnvKey: "STRIPE_PRICE_STARTER",
  },
  "personal-monthly": {
    id: "personal-monthly",
    type: "subscription",
    category: "personal",
    credits: 300,
    amount: 990,
    currency: "usd",
    billingInterval: "month",
    priceIdEnvKey: "STRIPE_PRICE_PERSONAL_MONTHLY",
    badge: "popular",
  },
  "pro-creator": {
    id: "pro-creator",
    type: "payment",
    category: "professional",
    credits: 600,
    amount: 1900,
    currency: "usd",
    billingInterval: "once",
    priceIdEnvKey: "STRIPE_PRICE_PRO_CREATOR",
  },
  "pro-monthly": {
    id: "pro-monthly",
    type: "subscription",
    category: "professional",
    credits: 1000,
    amount: 2490,
    currency: "usd",
    billingInterval: "month",
    priceIdEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
  "team-pack": {
    id: "team-pack",
    type: "payment",
    category: "team",
    credits: 1800,
    amount: 4900,
    currency: "usd",
    billingInterval: "once",
    priceIdEnvKey: "STRIPE_PRICE_TEAM_PACK",
  },
  "team-monthly": {
    id: "team-monthly",
    type: "subscription",
    category: "team",
    credits: 2500,
    amount: 4900,
    currency: "usd",
    billingInterval: "month",
    priceIdEnvKey: "STRIPE_PRICE_TEAM_MONTHLY",
    badge: "bestValue",
  },
  "team-yearly": {
    id: "team-yearly",
    type: "subscription",
    category: "team",
    credits: 3000,
    amount: 44900,
    currency: "usd",
    billingInterval: "year",
    priceIdEnvKey: "STRIPE_PRICE_TEAM_YEARLY",
    priceNoteKey: "yearlyNote",
  },
};

export const PRICING_TIERS: {
  category: PlanCategory;
  planIds: PlanId[];
}[] = [
  { category: "personal", planIds: ["starter", "personal-monthly"] },
  { category: "professional", planIds: ["pro-creator", "pro-monthly"] },
  { category: "team", planIds: ["team-pack", "team-monthly", "team-yearly"] },
];

export const ALL_PLAN_IDS = Object.keys(STRIPE_PLANS) as PlanId[];

export function getPlan(planId: string): StripePlan | undefined {
  return STRIPE_PLANS[planId as PlanId];
}

export function getPriceId(plan: StripePlan): string | undefined {
  const id = process.env[plan.priceIdEnvKey];
  return id && id.length > 0 ? id : undefined;
}

export function resolveCheckoutPlanId(
  plan: string | undefined,
  type?: "one-time" | "subscription"
): PlanId | undefined {
  if (!plan) return undefined;

  const stripePlan = getPlan(plan);
  if (!stripePlan) return undefined;

  if (type === "one-time" && stripePlan.type !== "payment") return undefined;
  if (type === "subscription" && stripePlan.type !== "subscription") {
    return undefined;
  }

  return stripePlan.id;
}

export function formatPlanPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}
