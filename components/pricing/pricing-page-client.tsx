"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { PricingCatalog } from "./pricing-catalog";
import { Button } from "@/components/ui/button";

function PricingContent() {
  const t = useTranslations("pricing");
  const { user } = useUser();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname + url.hash);
    }
  }, [checkoutStatus]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      void user?.reload();
    }
  }, [checkoutStatus, user]);

  return (
    <div className="space-y-12">
      <header className="text-center">
        <p className="text-sm font-medium text-brand-600">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-lg text-muted-foreground/80">{t("pageTitleEn")}</p>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          {t("pageSubtitle")}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground/80">
          {t("pageSubtitleEn")}
        </p>
      </header>

      {checkoutStatus === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t("successMessage")}
        </div>
      )}

      {checkoutStatus === "canceled" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <XCircle className="h-5 w-5 shrink-0" />
          {t("canceledMessage")}
        </div>
      )}

      <SignedIn>
        <PricingCatalog />
      </SignedIn>

      <SignedOut>
        <PricingCatalog />
        <div className="surface-card mx-auto max-w-lg p-8 text-center">
          <p className="text-muted-foreground">{t("signInRequired")}</p>
          <Button asChild className="mt-4" size="lg">
            <Link href="/sign-in">{t("signInToPurchase")}</Link>
          </Button>
        </div>
      </SignedOut>
    </div>
  );
}

export function PricingPageClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div className="mx-auto h-32 max-w-xl animate-pulse rounded-2xl bg-muted" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-muted"
                aria-hidden
              />
            ))}
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
