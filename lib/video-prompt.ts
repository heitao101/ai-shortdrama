import type { DramaStyleId } from "@/lib/constants";

const STYLE_HINTS: Record<DramaStyleId, string> = {
  anime: "anime style, vibrant colors, expressive characters",
  realistic: "photorealistic, natural lighting, lifelike details",
  hongkong:
    "Hong Kong neon street aesthetic, cinematic night mood, urban drama",
  cinematic: "cinematic widescreen framing, film grain, dramatic lighting",
  fantasy: "fantasy world, magical atmosphere, rich visual effects",
  noir: "film noir, high contrast shadows, moody atmosphere",
};

export function buildVideoPrompt(
  story: string,
  style: DramaStyleId,
  options?: { hasReferenceImages?: boolean; referenceCount?: number }
): string {
  const styleHint = STYLE_HINTS[style];
  const consistency =
    options?.hasReferenceImages && (options.referenceCount ?? 0) > 0
      ? `Keep character appearance, wardrobe, and facial features consistent with the ${options.referenceCount} reference image(s). `
      : "Maintain consistent character identity across shots. ";

  const trimmed = story.trim();
  const core = trimmed.length > 2000 ? `${trimmed.slice(0, 2000)}…` : trimmed;

  return `${consistency}Visual style: ${styleHint}. Scene: ${core}`;
}
