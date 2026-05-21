"use client";

import { useCallback, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckoutError,
  createCheckoutSession,
  type CheckoutPlanType,
} from "@/lib/checkout-client";
import type { PlanId } from "@/lib/stripe-plans";
import { cn } from "@/lib/utils";

type CheckoutButtonProps = {
  plan: PlanId;
  type: CheckoutPlanType;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
};

export function CheckoutButton({
  plan,
  type,
  children,
  className,
  variant = "default",
  size = "default",
}: CheckoutButtonProps) {
  const locale = useLocale();
  const t = useTranslations("pricing.checkout");
  const { isSignedIn, isLoaded, userId, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  const canCheckout =
    isLoaded && isUserLoaded && isSignedIn && Boolean(userId ?? user?.id);

  const handleCheckout = useCallback(async () => {
    if (!isLoaded || !isUserLoaded) return;

    if (!isSignedIn || !userId) {
      alert(t("signInRequired"));
      return;
    }

    setLoading(true);

    try {
      const { url } = await createCheckoutSession(plan, type, locale, getToken);
      window.location.assign(url);
    } catch (error) {
      console.error("[checkout]", { error, userId, plan, type, locale });

      if (error instanceof CheckoutError) {
        if (error.code === "NO_TOKEN") {
          alert(t("tokenError"));
        } else {
          alert(error.message || t("failed"));
        }
      } else {
        alert(error instanceof Error ? error.message : t("failed"));
      }

      setLoading(false);
    }
  }, [
    isLoaded,
    isUserLoaded,
    isSignedIn,
    userId,
    plan,
    type,
    locale,
    getToken,
    t,
  ]);

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("w-full gap-1.5", className)}
      disabled={loading || !canCheckout}
      onClick={handleCheckout}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("processing")}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
