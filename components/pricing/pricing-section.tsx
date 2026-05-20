"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { PricingGrid } from "./pricing-grid";
import { Button } from "@/components/ui/button";

function PricingSectionContent() {
  const t = useTranslations("pricing");
  const { user } = useUser();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutStatus) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}#pricing`
      );
    }
  }, [checkoutStatus]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      void user?.reload();
    }
  }, [checkoutStatus, user]);

  return (
    <>
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {checkoutStatus === "success" && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t("successMessage")}
        </div>
      )}

      {checkoutStatus === "canceled" && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <XCircle className="h-5 w-5 shrink-0" />
          {t("canceledMessage")}
        </div>
      )}

      <SignedIn>
        <PricingGrid />
      </SignedIn>

      <SignedOut>
        <div className="surface-card mx-auto max-w-md p-8 text-center">
          <p className="text-muted-foreground">{t("signInRequired")}</p>
          <Button asChild className="mt-4">
            <Link href="/sign-in">{t("signInToPurchase")}</Link>
          </Button>
        </div>
      </SignedOut>
    </>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24">
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden />
        }
      >
        <PricingSectionContent />
      </Suspense>
    </section>
  );
}
