"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { GenerateAction } from "./generate-action";
import { StoryInput } from "./story-input";
import { ImageUpload, type ReferenceImage } from "./image-upload";
import { StyleSelector } from "./style-selector";
import { GenerationLoading } from "@/components/ui/generation-loading";
import { GenerationError } from "@/components/ui/generation-error";
import type { DramaStyleId } from "@/lib/constants";
import { requestVideoGeneration } from "@/lib/generate-client";
import { cn } from "@/lib/utils";

export type GeneratedVideoResult = {
  videoUrl: string;
  taskId?: string;
  model?: string;
  durationSeconds?: number;
  mode?: "text-to-video" | "image-to-video";
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
  const { getToken } = useAuth();
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
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Video generation failed";
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
        </div>
      </div>
    </section>
  );
}
