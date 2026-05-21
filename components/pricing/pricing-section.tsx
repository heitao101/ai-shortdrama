"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Homepage teaser — full catalog at /pricing */
export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="scroll-mt-24">
      <div className="surface-card flex flex-col items-center gap-6 rounded-2xl p-8 text-center sm:p-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {t("homeTeaser")}
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/pricing">
            {t("viewAllPlans")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
