"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Coins, Sparkles } from "lucide-react";
import { parseCreditsMetadata } from "@/lib/credits-meta";
import { cn } from "@/lib/utils";

export function CreditsBadge({ className }: { className?: string }) {
  const { user, isLoaded } = useUser();
  const t = useTranslations("nav");

  if (!isLoaded || !user) {
    return null;
  }

  const { credits, isPro } = parseCreditsMetadata(
    user.publicMetadata as Record<string, unknown>
  );

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground",
        className
      )}
      title={t("creditsLabel")}
    >
      <Coins className="h-3.5 w-3.5 text-brand-600" />
      <span>{t("credits", { count: credits })}</span>
      {isPro && (
        <span className="inline-flex items-center gap-0.5 rounded bg-brand-600/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
          <Sparkles className="h-2.5 w-2.5" />
          Pro
        </span>
      )}
    </span>
  );
}
