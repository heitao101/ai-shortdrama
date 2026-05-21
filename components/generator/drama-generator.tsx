"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { GenerateAction } from "./generate-action";
import { StoryInput } from "./story-input";
import { ImageUpload, type ReferenceImage } from "./image-upload";
import { StyleSelector } from "./style-selector";
import { GenerationLoading } from "@/components/ui/generation-loading";
import { GenerationError } from "@/components/ui/generation-error";
import type { DramaStyleId } from "@/lib/constants";
import { VIDEO_GENERATION_CREDIT_COST } from "@/lib/generation-cost";
import { GenerateError, requestVideoGeneration } from "@/lib/generate-client";
import { cn } from "@/lib/utils";

export type GeneratedVideoResult = {
  videoUrl: string;
  taskId?: string;
  model?: string;
  durationSeconds?: number;
  mode?: "text-to-video" | "image-to-video";
  creditsRemaining?: number;
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
  const { user } = useUser();
  const [story, setStory] = useState("");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [style, setStyle] = useState<DramaStyleId>("hongkong");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = story.trim().length >= 20 && !isGenerating;

  async function handleGenerate() {
    if (!canGenerate) return;

    setError(null);
    setIsGenerating(true);
    onGeneratingChange?.(true);

    try {
      const data = await requestVideoGeneration(
        {
          prompt: story.trim(),
          style,
          images: images.map((img) => ({ file: img.file })),
        },
        getToken
      );

      onGenerate?.({
        videoUrl: data.videoUrl!,
        taskId: data.taskId,
        model: data.model,
        durationSeconds: data.durationSeconds,
        mode: data.mode,
        creditsRemaining: data.creditsRemaining,
      });

      if (data.creditsRemaining != null) {
        void user?.reload();
      }
    } catch (err) {
      const message =
        err instanceof GenerateError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Video generation failed";
      setError(message);
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

        {error ? (
          <GenerationError message={error} onDismiss={() => setError(null)} />
        ) : null}

        <div className="flex flex-col items-center gap-4 border-t border-border/60 pt-9">
          <GenerateAction
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
          <p className="text-center text-xs text-muted-foreground">
            {t("creditCost", { cost: VIDEO_GENERATION_CREDIT_COST })}
          </p>
        </div>
      </div>
    </section>
  );
}
