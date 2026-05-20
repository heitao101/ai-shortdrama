"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { DRAMA_STYLES, type DramaStyleId } from "@/lib/constants";
import { cn } from "@/lib/utils";

type StyleSelectorProps = {
  value: DramaStyleId;
  onChange: (style: DramaStyleId) => void;
  className?: string;
};

export function StyleSelector({
  value,
  onChange,
  className,
}: StyleSelectorProps) {
  const t = useTranslations("generator");
  const tStyles = useTranslations("styles");

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium text-foreground">
        {t("styleLabel")}
      </Label>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {DRAMA_STYLES.map((style) => {
          const selected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-sm transition-all",
                selected
                  ? "border-brand-600 bg-card text-foreground shadow-soft ring-2 ring-brand-600/15"
                  : "border-border bg-card text-muted-foreground shadow-soft hover:border-brand-200 hover:shadow-card"
              )}
            >
              <span className="text-xl" role="img" aria-hidden>
                {style.icon}
              </span>
              <span className="font-medium">{tStyles(style.id)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
