import { experimental_generateVideo as generateVideo } from "ai";
import type { DramaStyleId } from "@/lib/constants";
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

function toBuffer(base64: string): Buffer {
  return Buffer.from(stripDataUrlPrefix(base64), "base64");
}

function pickModel(images: ReferenceImageInput[]): VideoModelId {
  return images.length === 0 ? KLING_T2V : KLING_I2V;
}

export async function generateDramaVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!gatewayKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured");
  }

  const images = input.images ?? [];
  const model = pickModel(images);
  const duration = input.duration ?? DEFAULT_VIDEO_DURATION;
  const aspectRatio = input.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const fullPrompt = buildVideoPrompt(input.prompt, input.style, {
    hasReferenceImages: images.length > 0,
    referenceCount: images.length,
  });

  const headers = {
    Authorization: `Bearer ${gatewayKey}`,
  };

  if (model === KLING_T2V) {
    const result = await generateVideo({
      model: KLING_T2V,
      prompt: fullPrompt,
      aspectRatio,
      duration,
      headers,
      providerOptions: {
        klingai: {
          mode: "pro",
          multiShot: true,
          pollIntervalMs: 5000,
          pollTimeoutMs: 280_000,
        },
      },
    });
    return formatResult(result, model, duration);
  }

  const primary = images[0];
  if (!primary) {
    throw new Error("At least one reference image is required for image-to-video");
  }

  const primaryBuffer = toBuffer(primary.base64);
  const elementList =
    images.length > 1
      ? images.slice(1, 4).map((img) => ({
          image: toBuffer(img.base64),
        }))
      : undefined;

  const result = await generateVideo({
    model: KLING_I2V,
    prompt: {
      image: primaryBuffer,
      text: fullPrompt.slice(0, 2500),
    },
    aspectRatio,
    duration,
    headers,
    providerOptions: {
      klingai: {
        mode: "pro",
        pollIntervalMs: 5000,
        pollTimeoutMs: 280_000,
        ...(elementList ? { elementList } : {}),
      },
    } as unknown as Parameters<typeof generateVideo>[0]["providerOptions"],
  });

  return formatResult(result, KLING_I2V, duration);
}

function formatResult(
  result: Awaited<ReturnType<typeof generateVideo>>,
  model: VideoModelId,
  durationSeconds: number
): GenerateVideoOutput {
  const file = result.videos[0] ?? result.video;
  if (!file) {
    throw new Error("No video returned from the model");
  }

  const bytes =
    "uint8Array" in file && file.uint8Array
      ? file.uint8Array
      : "base64" in file && typeof file.base64 === "string"
        ? Buffer.from(file.base64, "base64")
        : null;

  if (!bytes || bytes.length === 0) {
    throw new Error("Generated video data is empty");
  }

  const mediaType =
    ("mediaType" in file && file.mediaType) || "video/mp4";
  const base64 =
    bytes instanceof Buffer ? bytes.toString("base64") : Buffer.from(bytes).toString("base64");
  const videoUrl = `data:${mediaType};base64,${base64}`;

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
