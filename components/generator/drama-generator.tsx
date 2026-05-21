"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Coins } from "lucide-react";
import { GenerateAction } from "./generate-action";
import { StoryInput } from "./story-input";
import { ImageUpload, type ReferenceImage } from "./image-upload";
import { StyleSelector } from "./style-selector";
import { DurationSelector } from "./duration-selector";
import { GenerationLoading } from "@/components/ui/generation-loading";
import { GenerationError } from "@/components/ui/generation-error";
import type { DramaStyleId } from "@/lib/constants";
import { parseCreditsMetadata } from "@/lib/credits-meta";
import { getCreditCostForDuration } from "@/lib/generation-cost";
import { GenerateError, requestVideoGeneration } from "@/lib/generate-client";
import { DEFAULT_VIDEO_DURATION, type VideoDurationSeconds } from "@/lib/video-duration";
import { cn } from "@/lib/utils";

export type GeneratedVideoResult = {
  videoUrl: string;
  taskId?: string;
  model?: string;
  durationSeconds?: number;
  mode?: "text-to-video" | "image-to-video";
  creditsRemaining?: number;
  creditsDeducted?: number;
};

type DramaGeneratorProps = {
  onGenerate?: (result: GeneratedVideoResult) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  className?: string;
};

export function DramaGenerator({
  onGenerate,
  onGeneratingChange,
  className,
}: DramaGeneratorProps) {
  const t = useTranslations("generator");
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [story, setStory] = useState("");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [style, setStyle] = useState<DramaStyleId>("hongkong");
  const [duration, setDuration] = useState<VideoDurationSeconds>(
    DEFAULT_VIDEO_DURATION
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const estimatedCost = getCreditCostForDuration(duration);

  const clientCredits = useMemo(() => {
    if (!user) return 0;
    return parseCreditsMetadata(
      user.publicMetadata as Record<string, unknown>
    ).credits;
  }, [user]);

  const creditsRemaining = balance ?? clientCredits;
  const hasEnoughCredits = creditsRemaining >= estimatedCost;

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;

    async function refreshBalance() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { credits?: number };
        if (!cancelled && typeof data.credits === "number") {
          setBalance(data.credits);
        }
      } catch {
        /* use Clerk publicMetadata fallback */
      }
    }

    void refreshBalance();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, getToken]);

  const canGenerate =
    story.trim().length >= 20 && !isGenerating && hasEnoughCredits;

  async function handleGenerate() {
    if (story.trim().length < 20 || isGenerating) return;

    if (!hasEnoughCredits) {
      setError(
        t("insufficientCredits", {
          required: estimatedCost,
          available: creditsRemaining,
        })
      );
      return;
    }

    setError(null);
    setIsGenerating(true);
    onGeneratingChange?.(true);

    try {
      const data = await requestVideoGeneration(
        {
          prompt: story.trim(),
          style,
          images: images.map((img) => ({ file: img.file })),
          duration,
        },
        getToken
      );

      if (typeof data.creditsRemaining === "number") {
        setBalance(data.creditsRemaining);
      }

      onGenerate?.({
        videoUrl: data.videoUrl!,
        taskId: data.taskId,
        model: data.model,
        durationSeconds: data.durationSeconds,
        mode: data.mode,
        creditsRemaining: data.creditsRemaining,
        creditsDeducted: data.creditsDeducted,
      });

      void user?.reload();
    } catch (err) {
      const message =
        err instanceof GenerateError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Video generation failed";
      setError(message);

      if (err instanceof GenerateError && err.creditsRemaining != null) {
        setBalance(err.creditsRemaining);
      }
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  }

  return (
    <section
      id="generator"
      className={cn("surface-card relative p-7 sm:p-9 lg:p-10", className)}
    >
      {isGenerating ? <GenerationLoading variant="overlay" /> : null}

      <div className="space-y-9">
        <StoryInput value={story} onChange={setStory} />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <ImageUpload images={images} onChange={setImages} />
          <StyleSelector value={style} onChange={setStyle} />
        </div>

        <DurationSelector
          value={duration}
          onChange={setDuration}
          disabled={isGenerating}
        />

        {!hasEnoughCredits && isLoaded && user ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            <p>{t("insufficientCredits", { required: estimatedCost, available: creditsRemaining })}</p>
            <Link
              href="/pricing"
              className="mt-2 inline-block font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              {t("topUpCredits")}
            </Link>
          </div>
        ) : null}

        {error ? (
          <GenerationError message={error} onDismiss={() => setError(null)} />
        ) : null}

        <div className="flex flex-col items-center gap-3 border-t border-border/60 pt-9">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 font-medium text-foreground">
              <Coins className="h-4 w-4 text-brand-600" />
              {t("creditsRemaining", { count: creditsRemaining })}
            </span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {t("estimatedCreditCost", { cost: estimatedCost })}
            </span>
          </div>

          <GenerateAction
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
    </section>
  );
}
