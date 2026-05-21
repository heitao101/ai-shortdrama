"use client";

import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { CheckoutButton } from "./checkout-button";
import {
  formatPlanPrice,
  STRIPE_PLANS,
  type PlanId,
} from "@/lib/stripe-plans";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  planId: PlanId;
};

export function PricingCard({ planId }: PricingCardProps) {
  const t = useTranslations("pricing");
  const plan = STRIPE_PLANS[planId];
  const isSubscription = plan.type === "subscription";
  const checkoutType = isSubscription ? "subscription" : "one-time";
  const highlighted = Boolean(plan.badge);

  const billingSuffix =
    plan.billingInterval === "year"
      ? t("perYear")
      : plan.billingInterval === "month"
        ? t("perMonth")
        : null;

  const badgeLabel =
    plan.badge === "popular"
      ? t("badgePopular")
      : plan.badge === "bestValue"
        ? t("badgeBestValue")
        : null;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all hover:shadow-card-hover",
        highlighted
          ? "border-brand-600 ring-2 ring-brand-600/15"
          : "border-border/70"
      )}
    >
      {badgeLabel && (
        <span
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-semibold text-white",
            plan.badge === "popular" ? "bg-brand-600" : "bg-emerald-600"
          )}
        >
          {badgeLabel}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t(`plans.${planId}.name`)}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground/80">
          {t(`plans.${planId}.nameEn`)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(`plans.${planId}.description`)}
        </p>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {formatPlanPrice(plan.amount, plan.currency)}
          </span>
          {billingSuffix && (
            <span className="text-sm text-muted-foreground">{billingSuffix}</span>
          )}
        </div>
        {plan.priceNoteKey && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`plans.${planId}.${plan.priceNoteKey}`)}
          </p>
        )}
        <p className="mt-3 text-sm font-medium text-brand-600">
          {t("creditsIncluded", { count: plan.credits })}
          {isSubscription && plan.billingInterval === "year"
            ? ` ${t("perMonthCredits")}`
            : ""}
        </p>
      </div>

      <ul className="mb-8 flex-1 space-y-2.5 text-sm text-muted-foreground">
        {(t.raw(`plans.${planId}.features`) as string[]).map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {feature}
          </li>
        ))}
      </ul>

      <CheckoutButton
        plan={planId}
        type={checkoutType}
        variant={highlighted ? "default" : "outline"}
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
}
