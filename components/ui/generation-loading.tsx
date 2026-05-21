"use client";

import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type GenerationLoadingProps = {
  className?: string;
  variant?: "overlay" | "inline";
};

export function GenerationLoading({
  className,
  variant = "inline",
}: GenerationLoadingProps) {
  const t = useTranslations("generator");

  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingCard />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200/60 bg-brand-50/30 p-10 text-center",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingCard />
      <p className="mt-4 text-sm text-muted-foreground">{t("loadingHint")}</p>
    </div>
  );
}

function LoadingCard() {
  const t = useTranslations("generator");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-brand-500/30 to-violet-500/30" />
        <Loader2 className="relative h-8 w-8 animate-spin text-brand-600" />
      </div>
      <div className="flex items-center gap-2 text-base font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-brand-600" />
        {t("generating")}
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{t("loadingSubtext")}</p>
    </div>
  );
}
