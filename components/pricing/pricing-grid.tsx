"use client";

import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { CheckoutButton } from "./checkout-button";
import { STRIPE_PLANS, type PlanId } from "@/lib/stripe-plans";
import { cn } from "@/lib/utils";

const PLAN_ORDER: PlanId[] = ["credits_100", "credits_500", "pro_monthly"];

function formatPrice(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function PricingGrid() {
  const t = useTranslations("pricing");

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLAN_ORDER.map((planId) => {
        const plan = STRIPE_PLANS[planId];
        const isSubscription = plan.type === "subscription";

        return (
          <article
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover",
              plan.popular
                ? "border-brand-600 ring-2 ring-brand-600/15"
                : "border-border/70"
            )}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-medium text-white">
                {t("popular")}
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {t(`plans.${plan.id}.name`)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`plans.${plan.id}.description`)}
              </p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                {formatPrice(plan.amount, plan.currency)}
              </span>
              {isSubscription && (
                <span className="text-sm text-muted-foreground">
                  {t("perMonth")}
                </span>
              )}
              <p className="mt-2 text-sm font-medium text-brand-600">
                {t("creditsIncluded", { count: plan.credits })}
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-2.5 text-sm text-muted-foreground">
              {(t.raw(`plans.${plan.id}.features`) as string[]).map(
                (feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {feature}
                  </li>
                )
              )}
            </ul>

            <CheckoutButton
              planId={plan.id}
              variant={plan.popular ? "default" : "outline"}
              size="lg"
            >
              {isSubscription ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("subscribe")}
                </>
              ) : (
                t("buyNow")
              )}
            </CheckoutButton>
          </article>
        );
      })}
    </div>
  );
}
