import { createHmac } from "node:crypto";
import type { DramaStyleId } from "@/lib/constants";
import { buildVideoPrompt } from "@/lib/video-prompt";
import { DEFAULT_VIDEO_DURATION } from "@/lib/video-duration";
import { DEFAULT_ASPECT_RATIO } from "@/lib/video-models";

const DEFAULT_BASE_URL = "https://api.klingai.com";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 280_000;

export type KlingCredentials = {
  accessKey: string;
  secretKey: string;
};

export type ReferenceImageInput = {
  base64: string;
  mimeType: string;
};

export type KlingGenerateInput = {
  prompt: string;
  style: DramaStyleId;
  images?: ReferenceImageInput[];
  duration?: number;
  aspectRatio?: "16:9" | "9:16";
};

export type KlingGenerateResult = {
  videoUrl: string;
  taskId: string;
  modelName: string;
  durationSeconds: number;
  mode: "text-to-video" | "image-to-video";
};

type KlingApiEnvelope<T> = {
  code: number;
  message: string;
  request_id?: string;
  data?: T;
};

type KlingCreateTaskData = {
  task_id: string;
  task_status?: string;
};

type KlingTaskData = {
  task_id: string;
  task_status: string;
  task_status_msg?: string;
  task_result?: {
    videos?: Array<{
      id?: string;
      url?: string;
      watermark_url?: string;
      duration?: string;
    }>;
  };
};

export function getKlingCredentials(): KlingCredentials | null {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) return null;
  return { accessKey, secretKey };
}

function getKlingBaseUrl(): string {
  return (process.env.KLING_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(
    /\/$/,
    ""
  );
}

/** HS256 JWT — fresh token per request session (Kling official auth). */
export function createKlingJwt(accessKey: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 5,
    })
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secretKey)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function stripDataUrlPrefix(data: string): string {
  const match = data.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : data;
}

/** Map SDK-style IDs (kling-v2.6-t2v) to Kling API model_name (kling-v2-6). */
function sdkIdToApiModelName(id: string): string {
  let name = id.replace(/-(t2v|i2v)$/i, "");
  name = name.replace(/\.0$/, "");
  return name.replace(/\./g, "-");
}

function resolveModelName(mode: "text-to-video" | "image-to-video"): string {
  const env =
    mode === "text-to-video"
      ? process.env.KLING_MODEL_T2V?.trim()
      : process.env.KLING_MODEL_I2V?.trim();
  if (env) return sdkIdToApiModelName(env);
  const fallback = process.env.KLING_MODEL_NAME?.trim();
  if (fallback) return sdkIdToApiModelName(fallback);
  return "kling-v2-6";
}

function assertKlingOk<T>(body: KlingApiEnvelope<T>, context: string): T {
  if (body.code !== 0) {
    throw new Error(
      body.message
        ? `Kling API ${context}: ${body.message} (code ${body.code})`
        : `Kling API ${context} failed (code ${body.code})`
    );
  }
  if (body.data == null) {
    throw new Error(`Kling API ${context}: empty response data`);
  }
  return body.data;
}

async function klingFetch<T>(
  credentials: KlingCredentials,
  path: string,
  init?: RequestInit
): Promise<KlingApiEnvelope<T>> {
  const token = createKlingJwt(credentials.accessKey, credentials.secretKey);
  const url = `${getKlingBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: KlingApiEnvelope<T>;
  try {
    body = JSON.parse(text) as KlingApiEnvelope<T>;
  } catch {
    throw new Error(
      `Kling API invalid JSON (${res.status}): ${text.slice(0, 200)}`
    );
  }

  if (!res.ok && body.code === undefined) {
    throw new Error(
      `Kling API HTTP ${res.status}: ${body.message ?? text.slice(0, 200)}`
    );
  }

  return body;
}

async function createText2VideoTask(
  credentials: KlingCredentials,
  params: {
    modelName: string;
    prompt: string;
    duration: number;
    aspectRatio: string;
  }
): Promise<string> {
  const body = assertKlingOk<KlingCreateTaskData>(
    await klingFetch<KlingCreateTaskData>(credentials, "/v1/videos/text2video", {
      method: "POST",
      body: JSON.stringify({
        model_name: params.modelName,
        prompt: params.prompt,
        negative_prompt:
          "blurry, low quality, watermark, text, logo, deformed face, distorted hands",
        mode: "pro",
        aspect_ratio: params.aspectRatio,
        duration: String(params.duration),
      }),
    }),
    "text2video create"
  );

  if (!body.task_id) {
    throw new Error("Kling text2video: missing task_id");
  }
  return body.task_id;
}

async function createImage2VideoTask(
  credentials: KlingCredentials,
  params: {
    modelName: string;
    prompt: string;
    imageBase64: string;
    duration: number;
  }
): Promise<string> {
  const body = assertKlingOk<KlingCreateTaskData>(
    await klingFetch<KlingCreateTaskData>(credentials, "/v1/videos/image2video", {
      method: "POST",
      body: JSON.stringify({
        model_name: params.modelName,
        prompt: params.prompt,
        negative_prompt:
          "blurry, low quality, watermark, text, logo, deformed face, distorted hands",
        mode: "pro",
        image: params.imageBase64,
        duration: String(params.duration),
      }),
    }),
    "image2video create"
  );

  if (!body.task_id) {
    throw new Error("Kling image2video: missing task_id");
  }
  return body.task_id;
}

async function pollVideoTask(
  credentials: KlingCredentials,
  endpoint: "/v1/videos/text2video" | "/v1/videos/image2video",
  taskId: string
): Promise<KlingTaskData> {
  const started = Date.now();

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const data = assertKlingOk<KlingTaskData>(
      await klingFetch<KlingTaskData>(
        credentials,
        `${endpoint}/${taskId}`,
        { method: "GET" }
      ),
      "task poll"
    );

    if (data.task_status === "succeed") {
      return data;
    }

    if (data.task_status === "failed") {
      throw new Error(
        data.task_status_msg ?? "Kling video generation failed"
      );
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Kling video generation timed out after ${Math.round(POLL_TIMEOUT_MS / 1000)}s`
  );
}

function extractVideoUrl(task: KlingTaskData): string {
  const url = task.task_result?.videos?.[0]?.url;
  if (!url) {
    throw new Error("Kling task succeeded but no video URL in response");
  }
  return url;
}

export async function generateKlingVideo(
  input: KlingGenerateInput
): Promise<KlingGenerateResult> {
  const credentials = getKlingCredentials();
  if (!credentials) {
    throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY are not configured");
  }

  const images = input.images ?? [];
  const mode: "text-to-video" | "image-to-video" =
    images.length === 0 ? "text-to-video" : "image-to-video";
  const duration = input.duration ?? DEFAULT_VIDEO_DURATION;
  const aspectRatio = input.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const fullPrompt = buildVideoPrompt(input.prompt, input.style, {
    hasReferenceImages: images.length > 0,
    referenceCount: images.length,
  });
  const modelName = resolveModelName(mode);

  if (mode === "text-to-video") {
    const taskId = await createText2VideoTask(credentials, {
      modelName,
      prompt: fullPrompt,
      duration,
      aspectRatio,
    });
    const task = await pollVideoTask(
      credentials,
      "/v1/videos/text2video",
      taskId
    );
    return {
      videoUrl: extractVideoUrl(task),
      taskId,
      modelName,
      durationSeconds: duration,
      mode,
    };
  }

  const primary = images[0];
  if (!primary) {
    throw new Error("At least one reference image is required for image-to-video");
  }

  const taskId = await createImage2VideoTask(credentials, {
    modelName,
    prompt: fullPrompt.slice(0, 2500),
    imageBase64: stripDataUrlPrefix(primary.base64),
    duration,
  });
  const task = await pollVideoTask(
    credentials,
    "/v1/videos/image2video",
    taskId
  );

  return {
    videoUrl: extractVideoUrl(task),
    taskId,
    modelName,
    durationSeconds: duration,
    mode,
  };
}
