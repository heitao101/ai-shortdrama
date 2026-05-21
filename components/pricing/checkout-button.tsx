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

async function parseCheckoutResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as {
      ok?: boolean;
      url?: string;
      error?: string;
    };
  }

  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      res.status === 401
        ? "Please sign in before purchasing"
        : `Server returned HTML instead of JSON (${res.status}). Check API route and env vars on Vercel.`
    );
  }

  try {
    return JSON.parse(text) as {
      ok?: boolean;
      url?: string;
      error?: string;
    };
  } catch {
    throw new Error(`Unexpected response (${res.status}): ${text.slice(0, 120)}`);
  }
}

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
        credentials: "include",
      });

      const data = await parseCheckoutResponse(res);

      if (!res.ok || data.ok === false || !data.url) {
        throw new Error(data.error ?? `Checkout failed (${res.status})`);
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("[checkout]", error);
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
