"use client";

import { useTranslations } from "next-intl";
import { Film, Download } from "lucide-react";
import type { GeneratedVideoResult } from "@/components/generator/drama-generator";
import { GenerationLoading } from "@/components/ui/generation-loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResultPreviewProps = {
  result: GeneratedVideoResult | null;
  isGenerating?: boolean;
  className?: string;
};

export function ResultPreview({
  result,
  isGenerating = false,
  className,
}: ResultPreviewProps) {
  const t = useTranslations("preview");

  const isEmpty = !result && !isGenerating;

  return (
    <section id="preview" className={cn("space-y-6", className)}>
      <h2 className="section-title">{t("title")}</h2>

      {isGenerating ? (
        <GenerationLoading variant="inline" />
      ) : isEmpty ? (
        <div className="surface-muted flex min-h-[300px] flex-col items-center justify-center p-10 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Film className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground">{t("empty")}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("emptyHint")}
          </p>
        </div>
      ) : result ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
          <div className="relative mx-auto aspect-[9/16] max-h-[min(70vh,720px)] w-full max-w-md bg-black">
            <video
              src={result.videoUrl}
              controls
              playsInline
              className="h-full w-full object-contain"
              poster=""
            >
              {t("videoUnsupported")}
            </video>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-4 sm:p-5">
            <div className="space-y-1 text-sm">
              {result.model ? (
                <p className="text-muted-foreground">
                  {t("model")}: <span className="text-foreground">{result.model}</span>
                </p>
              ) : null}
              {result.mode ? (
                <p className="text-muted-foreground">
                  {t("mode")}: <span className="text-foreground">{result.mode}</span>
                </p>
              ) : null}
              {result.taskId ? (
                <p className="truncate text-xs text-muted-foreground">
                  {t("taskId")}: {result.taskId}
                </p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={result.videoUrl} download="drama-ai-video.mp4">
                <Download className="mr-2 h-4 w-4" />
                {t("download")}
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
