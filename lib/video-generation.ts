import { experimental_generateVideo as generateVideo } from "ai";
import type { DramaStyleId } from "@/lib/constants";
import { createKlingProvider } from "@/lib/kling-client";
import { buildVideoPrompt } from "@/lib/video-prompt";
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_VIDEO_DURATION,
  KLING_I2V,
  KLING_T2V,
  type VideoModelId,
} from "@/lib/video-models";

export type ReferenceImageInput = {
  base64: string;
  mimeType: string;
};

export type GenerateVideoInput = {
  prompt: string;
  style: DramaStyleId;
  images?: ReferenceImageInput[];
  duration?: number;
  aspectRatio?: `${number}:${number}`;
};

export type GenerateVideoOutput = {
  videoUrl: string;
  model: VideoModelId;
  taskId?: string;
  durationSeconds: number;
};

function stripDataUrlPrefix(data: string): string {
  const match = data.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : data;
}

function toRawBase64(base64: string): string {
  return stripDataUrlPrefix(base64);
}

function pickModel(images: ReferenceImageInput[]): VideoModelId {
  return images.length === 0 ? KLING_T2V : KLING_I2V;
}

function resolveModelId(model: VideoModelId): VideoModelId {
  const t2v = process.env.KLING_MODEL_T2V?.trim();
  const i2v = process.env.KLING_MODEL_I2V?.trim();
  if (model === KLING_T2V && t2v) return t2v as VideoModelId;
  if (model === KLING_I2V && i2v) return i2v as VideoModelId;
  return model;
}

export async function generateDramaVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const kling = createKlingProvider();
  const images = input.images ?? [];
  const model = resolveModelId(pickModel(images));
  const duration = input.duration ?? DEFAULT_VIDEO_DURATION;
  const aspectRatio = input.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const fullPrompt = buildVideoPrompt(input.prompt, input.style, {
    hasReferenceImages: images.length > 0,
    referenceCount: images.length,
  });

  const pollTimeoutMs = 280_000;
  const providerOptions = {
    klingai: {
      mode: "pro" as const,
      pollIntervalMs: 5000,
      pollTimeoutMs,
    },
  };

  if (model.endsWith("-t2v")) {
    const result = await generateVideo({
      model: kling.video(model),
      prompt: fullPrompt,
      aspectRatio,
      duration,
      providerOptions,
    });
    return formatResult(result, model, duration);
  }

  const primary = images[0];
  if (!primary) {
    throw new Error("At least one reference image is required for image-to-video");
  }

  const result = await generateVideo({
    model: kling.video(model),
    prompt: {
      image: toRawBase64(primary.base64),
      text: fullPrompt.slice(0, 2500),
    },
    duration,
    providerOptions,
  });

  return formatResult(result, model, duration);
}

function formatResult(
  result: Awaited<ReturnType<typeof generateVideo>>,
  model: VideoModelId,
  durationSeconds: number
): GenerateVideoOutput {
  const urlCandidate = result.videos[0] as
    | { type?: string; url?: string }
    | undefined;

  if (
    urlCandidate?.type === "url" &&
    typeof urlCandidate.url === "string" &&
    urlCandidate.url.length > 0
  ) {
    const videoUrl = urlCandidate.url;
    const meta = result.providerMetadata as Record<string, unknown> | undefined;
    const klingMeta = meta?.klingai as Record<string, unknown> | undefined;
    const taskId =
      (klingMeta?.taskId as string | undefined) ??
      (klingMeta?.task_id as string | undefined);

    return {
      videoUrl,
      model,
      taskId,
      durationSeconds,
    };
  }

  const file = result.videos[0] ?? result.video;
  if (!file) {
    throw new Error("No video returned from Kling API");
  }

  const bytes =
    "uint8Array" in file && file.uint8Array
      ? file.uint8Array
      : "base64" in file && typeof file.base64 === "string"
        ? Buffer.from(file.base64, "base64")
        : null;

  if (!bytes) {
    throw new Error("Generated video data is empty");
  }
  const byteLength = bytes instanceof Buffer ? bytes.length : bytes.byteLength;
  if (byteLength === 0) {
    throw new Error("Generated video data is empty");
  }

  const mediaType =
    ("mediaType" in file && file.mediaType) || "video/mp4";
  const base64 =
    bytes instanceof Buffer
      ? bytes.toString("base64")
      : Buffer.from(bytes).toString("base64");

  const meta = result.providerMetadata as Record<string, unknown> | undefined;
  const klingMeta = meta?.klingai as Record<string, unknown> | undefined;
  const taskId =
    (klingMeta?.taskId as string | undefined) ??
    (klingMeta?.task_id as string | undefined);

  return {
    videoUrl: `data:${mediaType};base64,${base64}`,
    model,
    taskId,
    durationSeconds,
  };
}
