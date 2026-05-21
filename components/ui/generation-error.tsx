"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GenerationErrorProps = {
  message: string;
  onDismiss?: () => void;
  className?: string;
};

export function GenerationError({
  message,
  onDismiss,
  className,
}: GenerationErrorProps) {
  const t = useTranslations("generator");

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-destructive">{t("errorTitle")}</p>
        <p className="mt-1 text-muted-foreground">{message}</p>
      </div>
      {onDismiss ? (
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
          {t("errorDismiss")}
        </Button>
      ) : null}
    </div>
  );
}
