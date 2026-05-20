"use client";

import { useTranslations } from "next-intl";
import { Film, Play, Clock } from "lucide-react";
import type { GeneratedScene } from "@/components/generator/drama-generator";
import { cn } from "@/lib/utils";

type ResultPreviewProps = {
  scenes: GeneratedScene[];
  className?: string;
};

export function ResultPreview({ scenes, className }: ResultPreviewProps) {
  const t = useTranslations("preview");

  const isEmpty = scenes.length === 0;

  return (
    <section id="preview" className={cn("space-y-6", className)}>
      <h2 className="section-title">{t("title")}</h2>

      {isEmpty ? (
        <div className="surface-muted flex min-h-[300px] flex-col items-center justify-center p-10 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Film className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground">
            {t("empty")}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {scenes.map((scene) => (
            <article
              key={scene.id}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="relative aspect-[9/16] bg-muted/60">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-soft ring-1 ring-border transition group-hover:scale-[1.02]">
                    <Play className="ml-0.5 h-5 w-5 fill-brand-600 text-brand-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-card/95 p-3.5 backdrop-blur-sm">
                  <p className="text-sm font-medium text-foreground">
                    {t("scene", { index: scene.index })}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t("duration", { seconds: scene.duration })}
                  </p>
                </div>
                <span className="absolute right-2.5 top-2.5 rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {t(`status.${scene.status}`)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
