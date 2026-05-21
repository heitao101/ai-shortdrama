"use client";

import { useTranslations } from "next-intl";
import { PRICING_TIERS } from "@/lib/stripe-plans";
import { PricingCard } from "./pricing-card";
import { cn } from "@/lib/utils";

export function PricingCatalog() {
  const t = useTranslations("pricing");

  return (
    <div className="space-y-16">
      {PRICING_TIERS.map((tier) => (
        <section key={tier.category} aria-labelledby={`tier-${tier.category}`}>
          <div className="mb-8">
            <h2
              id={`tier-${tier.category}`}
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              {t(`tiers.${tier.category}.title`)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {t(`tiers.${tier.category}.subtitle`)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              {t(`tiers.${tier.category}.subtitleEn`)}
            </p>
          </div>

          <div
            className={cn(
              "grid gap-6",
              tier.planIds.length >= 3
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2"
            )}
          >
            {tier.planIds.map((planId) => (
              <PricingCard key={planId} planId={planId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
