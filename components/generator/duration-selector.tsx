"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { getCreditCostForDuration } from "@/lib/generation-cost";
import {
  DEFAULT_VIDEO_DURATION,
  VIDEO_DURATION_OPTIONS,
  type VideoDurationSeconds,
} from "@/lib/video-duration";
import { cn } from "@/lib/utils";

type DurationSelectorProps = {
  value: VideoDurationSeconds;
  onChange: (duration: VideoDurationSeconds) => void;
  disabled?: boolean;
  className?: string;
};

export function DurationSelector({
  value,
  onChange,
  disabled = false,
  className,
}: DurationSelectorProps) {
  const t = useTranslations("generator");
  const estimatedCost = getCreditCostForDuration(value);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Label className="text-sm font-medium text-foreground">
          {t("durationLabel")}
        </Label>
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          {t("estimatedCreditCost", { cost: estimatedCost })}
        </p>
      </div>

      <div
        role="group"
        aria-label={t("durationLabel")}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5"
      >
        {VIDEO_DURATION_OPTIONS.map((seconds) => {
          const selected = value === seconds;
          const cost = getCreditCostForDuration(seconds);
          return (
            <button
              key={seconds}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(seconds)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30",
                selected
                  ? "border-brand-600 bg-brand-50 text-foreground shadow-soft ring-2 ring-brand-600/20 dark:bg-brand-950/40"
                  : "border-border bg-card text-muted-foreground hover:border-brand-200 hover:bg-muted/50",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <span className="text-sm font-semibold">
                {t("durationOption", { seconds })}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  selected
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-muted-foreground"
                )}
              >
                {t("durationCredits", { cost })}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("durationHint", { seconds: value || DEFAULT_VIDEO_DURATION })}
      </p>
    </div>
  );
}
