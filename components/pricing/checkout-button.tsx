"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanId } from "@/lib/stripe-plans";
import { cn } from "@/lib/utils";

type CheckoutButtonProps = {
  planId: PlanId;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
};

export function CheckoutButton({
  planId,
  children,
  className,
  variant = "default",
  size = "default",
}: CheckoutButtonProps) {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, locale }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Unable to start checkout"
      );
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("w-full gap-1.5", className)}
      disabled={loading}
      onClick={handleCheckout}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          …
        </>
      ) : (
        children
      )}
    </Button>
  );
}
