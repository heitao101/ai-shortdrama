"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_STORY_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";

type StoryInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function StoryInput({ value, onChange, className }: StoryInputProps) {
  const t = useTranslations("generator");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="story" className="text-sm font-medium text-foreground">
          {t("storyLabel")}
        </Label>
        <span className="text-xs text-muted-foreground">
          {t("charCount", {
            current: value.length,
            max: MAX_STORY_LENGTH,
          })}
        </span>
      </div>
      <Textarea
        id="story"
        value={value}
        onChange={(e) =>
          onChange(e.target.value.slice(0, MAX_STORY_LENGTH))
        }
        placeholder={t("storyPlaceholder")}
        className="min-h-[220px] resize-y rounded-xl border-border bg-muted/40 text-sm leading-relaxed focus-visible:bg-card focus-visible:ring-primary/20 sm:min-h-[260px]"
      />
    </div>
  );
}
