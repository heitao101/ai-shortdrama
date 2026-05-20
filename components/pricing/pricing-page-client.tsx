"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { PricingGrid } from "./pricing-grid";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

function PricingContent() {
  const t = useTranslations("pricing");
  const { user } = useUser();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [success]);

  useEffect(() => {
    if (success) {
      void user?.reload();
    }
  }, [success, user]);

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t("successMessage")}
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
    </div>
  );
}

export function PricingPageClient() {
  return (
    <Suspense
      fallback={
        <div className="h-96 animate-pulse rounded-2xl bg-muted" aria-hidden />
      }
    >
      <PricingContent />
    </Suspense>
  );
}
