"use client";

import { useState } from "react";
import { GenerateAction } from "./generate-action";
import { StoryInput } from "./story-input";
import { ImageUpload, type ReferenceImage } from "./image-upload";
import { StyleSelector } from "./style-selector";
import type { DramaStyleId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type GeneratedScene = {
  id: string;
  index: number;
  duration: number;
  status: "processing" | "done";
};

type DramaGeneratorProps = {
  onGenerate?: (scenes: GeneratedScene[]) => void;
  className?: string;
};

export function DramaGenerator({ onGenerate, className }: DramaGeneratorProps) {
  const [story, setStory] = useState("");
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [style, setStyle] = useState<DramaStyleId>("hongkong");
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = story.trim().length >= 20 && !isGenerating;

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2400));

    const mockScenes: GeneratedScene[] = Array.from({ length: 4 }, (_, i) => ({
      id: `scene-${i + 1}`,
      index: i + 1,
      duration: 8 + i * 2,
      status: "done" as const,
    }));

    onGenerate?.(mockScenes);
    setIsGenerating(false);
  }

  return (
    <section
      id="generator"
      className={cn("surface-card p-7 sm:p-9 lg:p-10", className)}
    >
      <div className="space-y-9">
        <StoryInput value={story} onChange={setStory} />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <ImageUpload images={images} onChange={setImages} />
          <StyleSelector value={style} onChange={setStyle} />
        </div>

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
